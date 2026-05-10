import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AgentRunnableConfig, AgentNodeResult } from '../interfaces/orchestrator.interfaces';
import { ToolBoundLlm } from 'src/modules/ai/llms/interfaces/llm.types';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';
import { AgentEventsService } from '../../agent/services/agent-events.service';
import { AgentActionType } from '../../agent/enums/agent.enums';
import { GraphState } from '../state/graph.state';

@Injectable()
export class GraphNodesService {
  private readonly logger = new Logger(GraphNodesService.name);

  constructor(private readonly agentEvents: AgentEventsService) { }

  /**
   * Node: Agent/Model Reasoning
   */
  async callModel(
    state: typeof GraphState.State,
    llm: ToolBoundLlm,
    config: AgentRunnableConfig,
  ): Promise<{ messages: BaseMessage[]; iterationCount: number }> {

    this.agentEvents.emitAction(
      config.configurable || {},
      AgentActionType.REASONING_START,
      'AI is reasoning...',
    );

    const response = await llm.invoke(state.messages);
    return {
      messages: [response],
      iterationCount: (state.iterationCount || 0) + 1
    };
  }

  /**
   * Node: Tool Execution
   */
  async callTools(
    state: typeof GraphState.State,
    toolNode: ToolNode,
    config: AgentRunnableConfig,
  ): Promise<AgentNodeResult> {
    const toolCalls = OrchestratorStateUtils.getLastToolCalls(state.messages);

    // 1. Emit START events
    this.emitToolEvents(AgentActionType.TOOL_START, toolCalls, config);

    // 2. Execute all tools in the state
    const result = (await toolNode.invoke(state)) as AgentNodeResult;

    // Log the raw result for debugging
    this.logger.log(
      `Tool Result for ${toolCalls.map((tc) => tc.name).join(', ')}: ${JSON.stringify(result.messages.map((m) => m.content))}`,
    );

    // 3. Emit END events
    this.emitToolEvents(AgentActionType.TOOL_END, toolCalls, config);

    return result;
  }

  /**
   * Reusable helper to emit events for a batch of tool calls.
   */
  private emitToolEvents(
    type: AgentActionType.TOOL_START | AgentActionType.TOOL_END,
    toolCalls: any[],
    config: AgentRunnableConfig,
  ) {
    for (const tc of toolCalls) {
      this.agentEvents.emitAction(
        config.configurable || {},
        type,
        `Tool: ${tc.name}`,
        tc.id,
        { tool: tc.name },
      );
    }
  }
}
