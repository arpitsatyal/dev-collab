import { Injectable, Logger } from '@nestjs/common';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents } from '../enums/agent-events.enum';
import { AgentActionEvent, AgentRunnableConfig, AgentNodeResult, AgentState } from '../interfaces/agent.interfaces';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AgentStateUtils } from '../utils/agent-state.utils';

@Injectable()
export class AgentNodesService {
  private readonly logger = new Logger(AgentNodesService.name);

  constructor(private readonly eventEmitter: EventEmitter2) { }

  /**
   * Node: Agent/Model Reasoning
   */
  async callModel(
    state: AgentState,
    llm: BaseChatModel,
    config: AgentRunnableConfig,
  ): Promise<AgentNodeResult> {

    this.eventEmitter.emit(
      AgentEvents.ACTION,
      new AgentActionEvent(
        config.configurable || {},
        'REASONING_START',
        'AI is reasoning...',
      ),
    );

    const response = await llm.invoke(state.messages);
    return { messages: [response] };
  }

  /**
   * Node: Mission-Aware Tool Execution
   */
  async callTools(
    state: AgentState,
    toolNode: ToolNode,
    config: AgentRunnableConfig,
  ): Promise<AgentNodeResult> {
    const lastMsg = AgentStateUtils.getLastAIMessage(state.messages);
    const toolCalls = lastMsg?.tool_calls || [];

    for (const tc of toolCalls) {
      this.eventEmitter.emit(
        AgentEvents.ACTION,
        new AgentActionEvent(
          config.configurable || {},
          'TOOL_START',
          `Tool: ${tc.name}`,
          tc.id,
          { tool: tc.name },
        ),
      );
    }

    // Execute all tools in the state
    const result = (await toolNode.invoke(state)) as AgentNodeResult;

    // Log the raw result for debugging
    this.logger.log(
      `Tool Result for ${toolCalls.map((tc) => tc.name).join(', ')}: ${JSON.stringify(result.messages.map((m) => m.content))}`,
    );

    for (const tc of toolCalls) {
      this.eventEmitter.emit(
        AgentEvents.ACTION,
        new AgentActionEvent(
          config.configurable || {},
          'TOOL_END',
          `Tool: ${tc.name}`,
          tc.id,
          { tool: tc.name },
        ),
      );
    }

    return result;
  }
}
