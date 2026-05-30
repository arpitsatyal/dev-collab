import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  AgentRunnableConfig,
  AgentNodeResult,
} from '../types/orchestrator.types';
import { ToolBoundLlm } from 'src/modules/ai/llm/llm.types';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';
import { EventBusService } from 'src/common/events/event-bus.service';
import { AgentActionType } from 'src/common/events/agent-events.enums';
import { GraphState } from '../state/graph.state';

@Injectable()
export class GraphNodesService {
  private readonly logger = new Logger(GraphNodesService.name);

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Node: Agent/Model Reasoning
   */
  async callModel(
    state: typeof GraphState.State,
    llm: ToolBoundLlm,
    config: AgentRunnableConfig,
    systemPrompt?: string,
  ): Promise<{ messages: BaseMessage[]; iterationCount: number }> {
    this.eventBus.emitAgentAction(
      config.configurable || {},
      AgentActionType.REASONING_START,
      'AI is reasoning...',
    );

    const messages = [...state.messages];
    if (systemPrompt && messages.length > 0 && messages[0].getType() === 'system') {
      messages[0] = new SystemMessage(`${messages[0].content}\n\n[ROLE OVERRIDE]\n${systemPrompt}`);
    } else if (systemPrompt) {
      messages.unshift(new SystemMessage(`[ROLE OVERRIDE]\n${systemPrompt}`));
    }

    const response = (await llm.invoke(messages)) as BaseMessage;
    return {
      messages: [response],
      iterationCount: (state.iterationCount || 0) + 1,
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

    this.emitToolEvents(AgentActionType.TOOL_START, toolCalls, config);

    const result = (await toolNode.invoke(state)) as AgentNodeResult;

    this.logger.log(
      `Tool Result for ${toolCalls.map((tc) => tc.name).join(', ')}: ${JSON.stringify(result.messages.map((m) => m.content))}`,
    );

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
      this.eventBus.emitAgentAction(
        config.configurable || {},
        type,
        `Tool: ${tc.name}`,
        tc.id,
        { tool: tc.name },
      );
    }
  }
}
