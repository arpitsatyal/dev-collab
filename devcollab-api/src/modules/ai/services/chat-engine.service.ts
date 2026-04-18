import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptPort } from '../ports/prompt.port';
import { RetrievalPort } from '../ports/retrieval.port';
import { GenerationPort } from '../ports/generation.port';
import { LlmGateway } from '../ports/llm.port';
import { MessageService } from 'src/modules/message/message.service';
import { AgentPort } from '../ports/agent.port';
import { IntentClassifierLlm } from '../types';
import { IntentSchema } from '../schemas';
import { IChatContext, IChatResponse, IintentResult } from '../interfaces';

@Injectable()
export class ChatEngineService {
  private readonly logger = new Logger(ChatEngineService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly langGraphService: AgentPort,
    private readonly promptService: PromptPort,
    private readonly retrievalService: RetrievalPort,
    private readonly generationService: GenerationPort,
    private readonly messageService: MessageService,
  ) {}

  /**
   * Main entry point for AI responses.
   * Acts as an orchestrator for intent classification and delegation.
   */
  async getAIResponse(
    chatId: string,
    question: string,
    filters?: Record<string, any>,
  ): Promise<IChatResponse> {
    const history = await this.getFormattedHistory(chatId, 10);
    const context = this.createChatContext(chatId, question, history, filters);

    const { intent, scope } = await this.classifyIntent(context);

    if (intent === 'CONVERSATIONAL') {
      return this.handleConversational(context, scope);
    }

    return this.handleWorkspaceQuery(context);
  }

  private createChatContext(
    chatId: string,
    question: string,
    history: string,
    filters?: Record<string, any>,
  ): IChatContext {
    const workspaceId = filters?.workspaceId
      ? String(filters.workspaceId)
      : undefined;
    return {
      chatId,
      question,
      history,
      filters,
      inWorkspace: !!workspaceId,
      workspaceId,
    };
  }

  private async classifyIntent(context: IChatContext): Promise<IintentResult> {
    const classifierLlm = (await this.llmGateway.getReasoningStructuredLLM(
      IntentSchema,
      'classify_intent',
    )) as IntentClassifierLlm;

    const intentMessages = this.promptService.buildIntentClassificationPrompt(
      context.question,
      context.history,
      context.inWorkspace,
    );

    try {
      const result = await classifierLlm.invoke(intentMessages);
      if (result.confidence > 0.4) {
        return { intent: result.intent, scope: result.scope };
      }
      this.logger.warn(
        'Intent Classification: Low confidence, defaulting to WORKSPACE_QUERY',
      );
    } catch (e) {
      this.logger.warn(
        `Intent Classification failed: ${e instanceof Error ? e.message : e}`,
      );
    }

    return {
      intent: 'WORKSPACE_QUERY',
      scope: context.inWorkspace ? 'APP_SPECIFIC' : 'OUT_OF_SCOPE',
    };
  }

  private async handleConversational(
    context: IChatContext,
    scope: 'APP_SPECIFIC' | 'DOMAIN_KNOWLEDGE' | 'OUT_OF_SCOPE',
  ): Promise<IChatResponse> {
    this.logger.log(`Handling CONVERSATIONAL intent (Scope: ${scope})`);

    const messages = this.promptService.buildConversationalMessages(
      context.history,
      context.question,
      scope,
    );

    const conversationalLlm = await this.llmGateway.getSpeedyLLM();
    const answer = await conversationalLlm
      .pipe(new StringOutputParser())
      .invoke(messages);

    return {
      answer,
      context: '',
      validated: { isValid: true, warning: null },
    };
  }

  private async handleWorkspaceQuery(
    context: IChatContext,
  ): Promise<IChatResponse> {
    if (context.inWorkspace && context.workspaceId) {
      return this.getAIResponseWithTools(
        context.chatId,
        context.question,
        context.history,
        context.workspaceId,
      );
    }
    return this.getAIResponseWithSearch(
      context.chatId,
      context.question,
      context.history,
      context.filters,
    );
  }

  private async getFormattedHistory(
    chatId: string,
    limit: number,
  ): Promise<string> {
    const messages = await this.messageService.getHistory(chatId, limit);
    return messages
      .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
      .join('\n');
  }

  private async getAIResponseWithTools(
    chatId: string,
    question: string,
    history: string,
    workspaceId: string,
  ): Promise<IChatResponse> {
    this.logger.log(
      `LangGraph: Processing with tools for workspace ${workspaceId}`,
    );
    const messages: BaseMessage[] = this.promptService.buildChatMessages(
      history,
      question,
      workspaceId,
    );

    const result = await this.langGraphService.runAgentGraph(
      messages,
      workspaceId,
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
    chatId: string,
    question: string,
    history: string,
    filters?: Record<string, any>,
  ): Promise<IChatResponse> {
    this.logger.log('HybridSearch: Processing global query');
    const queryGenLlm = await this.llmGateway.getReasoningLLM();

    const queries = await this.retrievalService.generateQueryVariations(
      question,
      queryGenLlm,
    );
    const filteredResults = await this.retrievalService.performHybridSearch(
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

    const fullPrompt = await this.promptService.constructPrompt(
      context,
      history,
      question,
    );
    const answerLlm = await this.llmGateway.getSpeedyLLM();
    const generated = await this.generationService.generateAnswer(
      answerLlm,
      fullPrompt,
      context,
      filteredResults,
    );
    return { ...generated, validated: { isValid: true, warning: null } };
  }
}
