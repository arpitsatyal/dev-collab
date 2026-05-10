import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { AiConfig } from 'src/modules/ai/ai.config';
import { LlmGateway } from 'src/modules/ai/llms/ports/llm.port';
import { ToolRegistry } from 'src/modules/ai/tools/ports/tools.port';
import { IAiResult } from 'src/modules/ai/interfaces';
import { AgentOrchestrator } from '../../agent/ports/agent.port';
import { AgentRunOptions } from '../../agent/interfaces/agent.interfaces';
import { OrchestratorStateUtils } from '../utils/orchestrator-state.utils';
import { GraphFactoryService } from '../services/graph-factory.service';

@Injectable()
export class LangGraphAdapter implements AgentOrchestrator {
  private readonly logger = new Logger(LangGraphAdapter.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly toolService: ToolRegistry,
    private readonly config: AiConfig,
    private readonly graphFactory: GraphFactoryService,
  ) { }

  /**
   * Orchestrates the agentic execution using LangGraph.
   */
  async run(
    messages: BaseMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult> {
    const tools = await this.toolService.getTools(workspaceId);
    const llmWithTools = await this.llmGateway.getReasoningToolBoundLLM(tools);

    const app = this.graphFactory.createGraph(llmWithTools, tools);

    const thread_id = options.threadId || workspaceId;
    const config = {
      recursionLimit: this.config.maxIterations,
      configurable: {
        workspaceId,
        thread_id,
        ...options.configurable,
      },
    };

    const input = messages.length > 0 ? { messages } : null;
    let finalState = await app.invoke(input, config);

    let state = await app.getState(config);

    // Auto-approve loop
    while (state.next && state.next.length > 0 && options.autoApprove) {
      this.logger.log(`Agent ${thread_id} auto-approving interrupt for nodes: ${state.next.join(', ')}`);
      finalState = await app.invoke(null, config);
      state = await app.getState(config);
    }

    if (state.next && state.next.length > 0) {
      const isPeriodicPause = state.next.includes('pause');
      this.logger.log(`Agent ${thread_id} interrupted for ${isPeriodicPause ? 'periodic check-in' : 'human approval'} (Next nodes: ${state.next.join(', ')})`);

      const interimResult = this.mapFinalStateToResult(state.values);

      return {
        answer: isPeriodicPause
          ? `I've reached iteration ${state.values.iterationCount}. Just checking in before I continue my reasoning.`
          : interimResult.answer,
        calledTools: [],
        interrupted: true,
      };
    }

    return this.mapFinalStateToResult(finalState);
  }

  private mapFinalStateToResult(finalState: any): IAiResult {
    const messages = finalState.messages as BaseMessage[];
    const calledTools = OrchestratorStateUtils.getToolSequence(messages);

    if (calledTools.length === 0) {
      this.logger.log('Response: Direct LLM (no tools used)');
    }
    this.logger.log(`Response: Tool Sequence [${calledTools.join(' -> ')}]`);

    const lastAIMessage = OrchestratorStateUtils.getLastAIMessage(messages);
    const answer = OrchestratorStateUtils.getContent(lastAIMessage);

    return { answer, calledTools };
  }
}
