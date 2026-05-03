import { Injectable, Logger } from '@nestjs/common';
import {
  BaseMessage,
} from '@langchain/core/messages';
import { AiConfig } from 'src/modules/ai/ai.config';
import { LlmGateway } from 'src/modules/ai/llms/ports/llm.port';
import { ToolRegistry } from 'src/modules/ai/tools/ports/tools.port';
import { AgentPort } from '../ports/agent.port';
import { AgentGraphFactoryService } from './agent-graph-factory.service';
import { IAiResult } from 'src/modules/ai/interfaces';
import { AgentRunOptions } from '../interfaces/agent.interfaces';
import { AgentStateUtils } from '../utils/agent-state.utils';

@Injectable()
export class LangGraphService implements AgentPort {
  private readonly logger = new Logger(LangGraphService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly toolService: ToolRegistry,
    private readonly config: AiConfig,
    private readonly graphFactory: AgentGraphFactoryService,
  ) { }

  /**
   * Orchestrates the agentic mission execution.
   */
  async runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult> {
    // 1. Prepare Tools and LLM
    const tools = await this.toolService.getTools(workspaceId);
    const llmWithTools = await this.llmGateway.getReasoningToolBoundLLM(tools);

    // 2. Build the Graph
    const app = this.graphFactory.createGraph(llmWithTools, tools);

    // 3. Invoke the Graph
    const finalState = await app.invoke(
      { messages },
      {
        recursionLimit: this.config.maxIterations,
        configurable: {
          workspaceId,
          thread_id: options.threadId,
          ...options.configurable,
        },
      },
    );

    // 5. Parse and Return Results
    return this.mapFinalStateToResult(finalState);
  }

  /**
   * Maps the final LangGraph state to the standard IAiResult format.
   */
  private mapFinalStateToResult(finalState: any): IAiResult {
    const messages = finalState.messages as BaseMessage[];

    const calledTools = AgentStateUtils.getToolSequence(messages);

    if (calledTools.length === 0) {
      this.logger.log('Response: Direct LLM (no tools used)');
    }
    this.logger.log(`Response: Tool Sequence [${calledTools.join(' -> ')}]`);

    const lastAIMessage = AgentStateUtils.getLastAIMessage(messages);
    const answer = AgentStateUtils.getContent(lastAIMessage);

    return { answer, calledTools };
  }
}
