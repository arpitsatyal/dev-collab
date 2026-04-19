import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { MissionService } from '../../../mission/mission.service';

@Injectable()
export class AgentNodesService {
  private readonly logger = new Logger(AgentNodesService.name);

  constructor(private readonly missionService: MissionService) { }

  /**
   * Node: Agent/Model Reasoning
   */
  async callModel(
    state: typeof MessagesAnnotation.State,
    llm: any,
    missionId?: string,
  ): Promise<{ messages: BaseMessage[] }> {
    if (missionId) {
      //maybe use better event stream
      await this.missionService.pushLog(missionId, 'AI is reasoning...');
    }
    const response = await llm.invoke(state.messages);
    return { messages: [response] };
  }

  /**
   * Node: Mission-Aware Tool Execution
   */
  async callTools(
    state: typeof MessagesAnnotation.State,
    toolNode: ToolNode,
    missionId?: string,
  ): Promise<{ messages: BaseMessage[] }> {
    if (!missionId) {
      return toolNode.invoke(state) as any;
    }

    const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
    const toolCalls = lastMsg.tool_calls || [];

    // Track each tool call as a mission step
    const stepIds: string[] = [];
    for (const tc of toolCalls) {
      const step = await this.missionService.addStep(
        missionId,
        `Tool: ${tc.name}`,
        'RUNNING',
      );
      await this.missionService.pushLog(
        missionId,
        `Agent executing tool: ${tc.name}`,
        step.id,
      );
      stepIds.push(step.id);
    }

    // Execute all tools in the state
    const result = (await toolNode.invoke(state)) as {
      messages: ToolMessage[];
    };

    // Log the raw result for debugging
    this.logger.log(
      `Tool Result for ${toolCalls.map((tc) => tc.name).join(', ')}: ${JSON.stringify(result.messages.map((m) => m.content))}`,
    );

    // Mark all related mission steps as complete
    for (const sid of stepIds) {
      await this.missionService.updateStepStatus(sid, missionId, 'COMPLETED');
    }

    return result;
  }
}
