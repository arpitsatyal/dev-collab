import { Injectable, Logger } from '@nestjs/common';
import {
  AIMessage,
  BaseMessage,
  ToolMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { AiConfig } from '../../ai.config';
import { LlmGateway } from '../../ports/llm.port';
import { ToolRegistry } from '../../tools/ports/tools.port';
import { AgentPort } from '../../ports/agent.port';
import { AgentGraphFactoryService } from './agent-graph-factory.service';
import { AgentPromptsService } from './agent-prompts.service';
import { IAiResult } from '../../interfaces';

@Injectable()
export class LangGraphService implements AgentPort {
  private readonly logger = new Logger(LangGraphService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly toolService: ToolRegistry,
    private readonly config: AiConfig,
    private readonly graphFactory: AgentGraphFactoryService,
  ) {}

  /**
   * Orchestrates the agentic mission execution.
   */
  async runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    options?: {
      threadId?: string;
      configurable?: Record<string, any>;
    },
  ): Promise<IAiResult> {
    // 1. Prepare Tools and LLM
    const tools = await this.toolService.getTools(workspaceId);
    const llmWithTools = await this.llmGateway.getReasoningToolBoundLLM(tools);

    // 2. Build the Graph
    const app = this.graphFactory.createGraph(llmWithTools, tools);

    // 3. Invoke the Graph
    const thread_id = options?.threadId || workspaceId;
    const finalState = await app.invoke(
      { messages },
      {
        recursionLimit: this.config.maxIterations,
        configurable: {
          workspaceId,
          thread_id,
          ...options?.configurable,
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
    const calledTools = finalState.messages
      .filter((m: BaseMessage) => m instanceof ToolMessage)
      .map((m: ToolMessage) => m.name)
      .filter(Boolean) as string[];

    if (calledTools.length === 0) {
      this.logger.log('Response: Direct LLM (no tools used)');
    } else {
      this.logger.log(`Response: Tool Sequence [${calledTools.join(' -> ')}]`);
    }

    const lastAIMessage = [...finalState.messages]
      .reverse()
      .find((m: BaseMessage) => m instanceof AIMessage) as
      | AIMessage
      | undefined;

    const answer =
      typeof lastAIMessage?.content === 'string'
        ? lastAIMessage.content
        : JSON.stringify(
            lastAIMessage?.content ?? 'Unable to generate a response.',
          );

    return { answer, calledTools };
  }
}
