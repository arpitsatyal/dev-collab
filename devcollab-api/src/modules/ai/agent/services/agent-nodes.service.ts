import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents } from '../enums/agent-events.enum';
import { AgentActionEvent } from '../interfaces/agent.interfaces';

@Injectable()
export class AgentNodesService {
  private readonly logger = new Logger(AgentNodesService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Node: Agent/Model Reasoning
   */
  async callModel(
    state: typeof MessagesAnnotation.State,
    llm: any,
    missionId?: string,
  ): Promise<{ messages: BaseMessage[] }> {
    if (missionId) {
      this.eventEmitter.emit(AgentEvents.ACTION, {
        missionId,
        type: 'REASONING_START',
        label: 'AI is reasoning...',
      } as AgentActionEvent);
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

    for (const tc of toolCalls) {
      this.eventEmitter.emit(AgentEvents.ACTION, {
        missionId,
        type: 'TOOL_START',
        label: `Tool: ${tc.name}`,
        callId: tc.id,
        payload: { tool: tc.name },
      } as AgentActionEvent);
    }

    // Execute all tools in the state
    const result = (await toolNode.invoke(state)) as {
      messages: ToolMessage[];
    };

    // Log the raw result for debugging
    this.logger.log(
      `Tool Result for ${toolCalls.map((tc) => tc.name).join(', ')}: ${JSON.stringify(result.messages.map((m) => m.content))}`,
    );

    for (const tc of toolCalls) {
      this.eventEmitter.emit(AgentEvents.ACTION, {
        missionId,
        type: 'TOOL_END',
        label: `Tool: ${tc.name}`,
        callId: tc.id,
        payload: { tool: tc.name },
      } as AgentActionEvent);
    }

    return result;
  }
}
