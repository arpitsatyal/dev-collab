import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { AgentPort } from 'src/modules/ai/agent/ports/agent.port';
import { PromptPort } from 'src/modules/ai/ports/prompt.port';
import { RetrievalPort } from 'src/modules/ai/ports/retrieval.port';
import { GenerationPort } from 'src/modules/ai/ports/generation.port';
import { LlmGateway } from 'src/modules/ai/llms/ports/llm.port';
import {
  IChatContext,
  IChatResponse,
  GetAIResponseWithToolsParams,
  GetAIResponseWithSearchParams
} from 'src/modules/ai/interfaces';

@Injectable()
export class ChatWorkspaceQueryHandler {
  private readonly logger = new Logger(ChatWorkspaceQueryHandler.name);

  constructor(
    private readonly agentPort: AgentPort,
    private readonly promptPort: PromptPort,
    private readonly retrievalPort: RetrievalPort,
    private readonly generationPort: GenerationPort,
    private readonly llmGateway: LlmGateway,
  ) { }

  /**
   * Main entry point for workspace-related queries.
   * Decides between Tool-based execution (LangGraph) and Search-based RAG.
   */
  async handle(context: IChatContext): Promise<IChatResponse> {
    if (context.inWorkspace && context.workspaceId) {
      return this.getAIResponseWithTools({
        chatId: context.chatId,
        question: context.question,
        history: context.history,
        workspaceId: context.workspaceId,
      });
    }

    return this.getAIResponseWithSearch({
      chatId: context.chatId,
      question: context.question,
      history: context.history,
      filters: context.filters,
    });
  }

  private async getAIResponseWithTools(
    params: GetAIResponseWithToolsParams,
  ): Promise<IChatResponse> {
    const { history, question, workspaceId } = params;
    this.logger.log(`LangGraph: Processing with tools for workspace ${workspaceId}`);

    const messages: BaseMessage[] = this.promptPort.buildChatMessages(
      history,
      question,
      workspaceId,
    );

    const result = await this.agentPort.runAgentGraph(
      messages,
      workspaceId,
      { threadId: params.chatId },
    );

    const toolsUsed = result.calledTools ?? [];
    this.logger.log(
      toolsUsed.length === 0
        ? 'LangGraph: LLM answered directly'
        : `LangGraph tools used: ${toolsUsed.join(' -> ')}`,
    );

    return { ...result, validated: { isValid: true, warning: null } };
  }

  private async getAIResponseWithSearch(
    params: GetAIResponseWithSearchParams,
  ): Promise<IChatResponse> {
    const { question, history, filters } = params;
    this.logger.log('HybridSearch: Processing global query');

    const queryGenLlm = await this.llmGateway.getReasoningLLM();
    const queries = await this.retrievalPort.generateQueryVariations(question, queryGenLlm);

    const filteredResults = await this.retrievalPort.performHybridSearch(
      queries,
      question,
      filters,
    );

    const context = filteredResults
      .map(({ doc }) => {
        const type = doc.metadata?.type || 'General Info';
        const title = doc.metadata?.workspaceTitle || 'Unknown Workspace';
        return `--- Source: Information from ${type} within workspace "${title}" ---\n${doc.pageContent}`;
      })
      .join('\n\n');

    const fullPrompt = await this.promptPort.constructPrompt(context, history, question);
    const answerLlm = await this.llmGateway.getSpeedyLLM();

    const generated = await this.generationPort.generateAnswer(
      answerLlm,
      fullPrompt,
      context,
      filteredResults,
    );

    return { ...generated, validated: { isValid: true, warning: null } };
  }
}
