import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentEvents } from '../enums/agent-events.enum';
import { AgentActionEvent, AgentRunnableConfig, AgentNodeResult } from '../interfaces/agent.interfaces';
import { ToolBoundLlm } from 'src/modules/ai/llms/interfaces/llm.types';
import { AgentStateUtils } from '../utils/agent-state.utils';

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  iterationCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
});

@Injectable()
export class AgentNodesService {
  private readonly logger = new Logger(AgentNodesService.name);

  constructor(private readonly eventEmitter: EventEmitter2) { }

  /**
   * Node: Agent/Model Reasoning
   */
  async callModel(
    state: typeof AgentState.State,
    llm: ToolBoundLlm,
    config: AgentRunnableConfig,
  ): Promise<{ messages: BaseMessage[]; iterationCount: number }> {

    this.eventEmitter.emit(
      AgentEvents.ACTION,
      new AgentActionEvent(
        config.configurable || {},
        'REASONING_START',
        'AI is reasoning...',
      ),
    );

    const response = await llm.invoke(state.messages);
    return { 
      messages: [response],
      iterationCount: (state.iterationCount || 0) + 1
    };
  }

  /**
   * Node: Mission-Aware Tool Execution
   */
  async callTools(
    state: typeof AgentState.State,
    toolNode: ToolNode,
    config: AgentRunnableConfig,
  ): Promise<AgentNodeResult> {
    const toolCalls = AgentStateUtils.getLastToolCalls(state.messages);

    // 1. Emit START events
    this.emitToolEvents('TOOL_START', toolCalls, config);

    // 2. Execute all tools in the state
    const result = (await toolNode.invoke(state)) as AgentNodeResult;

    // Log the raw result for debugging
    this.logger.log(
      `Tool Result for ${toolCalls.map((tc) => tc.name).join(', ')}: ${JSON.stringify(result.messages.map((m) => m.content))}`,
    );

    // 3. Emit END events
    this.emitToolEvents('TOOL_END', toolCalls, config);

    return result;
  }

  /**
   * Reusable helper to emit events for a batch of tool calls.
   */
  private emitToolEvents(
    type: 'TOOL_START' | 'TOOL_END',
    toolCalls: any[],
    config: AgentRunnableConfig,
  ) {
    for (const tc of toolCalls) {
      this.eventEmitter.emit(
        AgentEvents.ACTION,
        new AgentActionEvent(
          config.configurable || {},
          type,
          `Tool: ${tc.name}`,
          tc.id,
          { tool: tc.name },
        ),
      );
    }
  }
}
