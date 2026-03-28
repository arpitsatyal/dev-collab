import { Injectable, Logger } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AiConfig } from '../ai.config';
import { PromptPort } from '../ports/prompt.port';
import { RetrievalPort, SearchHit } from '../ports/retrieval.port';
import { GenerationPort } from '../ports/generation.port';
import { LlmGateway } from '../ports/llm.port';
import { MessageService } from 'src/modules/message/message.service';
import { AgentPort } from '../ports/agent.port';
import { IntentClassifierLlm } from '../types';
import { IntentSchema } from '../schemas';

@Injectable()
export class ChatEngineService {
  private readonly logger = new Logger(ChatEngineService.name);

  constructor(
    private readonly promptService: PromptPort,
    private readonly retrievalService: RetrievalPort,
    private readonly generationService: GenerationPort,
    private readonly llmGateway: LlmGateway,
    private readonly messageService: MessageService,
    private readonly config: AiConfig,
    private readonly langGraphService: AgentPort,
  ) { }

  private async getFormattedHistory(chatId: string, limit: number): Promise<string> {
    const messages = await this.messageService.getHistory(chatId, limit);
    return messages
      .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
      .join('\n');
  }

  private async getAIResponseWithTools(
    chatId: string,
    question: string,
    workspaceId: string,
  ) {
    const history = await this.getFormattedHistory(chatId, 10);
    const messages: BaseMessage[] = this.promptService.buildChatMessages(
      history,
      question,
      workspaceId,
    );

    const { answer, calledTools } = await this.langGraphService.runAgentGraph(
      messages,
      workspaceId,
    );

    if (calledTools.length === 0) {
      this.logger.log('LangGraph: LLM answered directly (no tools).');
    } else {
      this.logger.log(
        `LangGraph tools used (${calledTools.length}): ${calledTools.join(' -> ')}`,
      );
    }

    return { answer, context: '', validated: { isValid: true, warning: null } };
  }

  private async getAIResponseWithSearch(
    chatId: string,
    question: string,
    filters?: Record<string, any>,
  ) {
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

    if (filteredResults.length === 0) {
      return {
        answer: `${this.config.appScopeReply} Try referencing a workspace entity like a work item title, snippet filename, or doc label.`,
        context: '',
        validated: { isValid: true, warning: null },
      };
    }

    filteredResults.forEach(({ doc, score }: SearchHit, i: number) => {
      this.logger.debug(
        `Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.workspaceTitle}`,
      );
    });

    const context =
      filteredResults.length > 0
        ? filteredResults
          .map(({ doc }) => {
            const type = doc.metadata?.type || 'General Info';
            const title = doc.metadata?.workspaceTitle || 'Unknown Workspace';
            return `--- Source: Information from ${type} within workspace "${title}" ---\n${doc.pageContent}`;
          })
          .join('\n\n')
        : "I don't have enough specific information in my records to answer this fully.";

    const history = await this.getFormattedHistory(chatId, 10);
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

  async getAIResponse(
    chatId: string,
    question: string,
    filters?: Record<string, any>,
  ) {
    const inWorkspace = Boolean(filters?.workspaceId);

    const classifierLlm = await this.llmGateway.getReasoningStructuredLLM(
      IntentSchema,
      'classify_intent',
    ) as IntentClassifierLlm;

    const intentMessages =
      this.promptService.buildIntentClassificationPrompt(question, inWorkspace);

    let intent = 'WORKSPACE_QUERY';
    let scope: 'APP_SPECIFIC' | 'OUT_OF_SCOPE' = inWorkspace
      ? 'APP_SPECIFIC'
      : 'OUT_OF_SCOPE';

    try {
      const result = await classifierLlm.invoke(intentMessages);
      if (result.confidence > 0.4) {
        intent = result.intent;
        scope = result.scope;
      } else {
        this.logger.warn(
          'Intent Classification: Low confidence, defaulting to WORKSPACE_QUERY',
        );
      }
    } catch (e) {
      this.logger.warn(
        `Intent Classification failed, defaulting to WORKSPACE_QUERY: ${e instanceof Error ? e.message : e
        }`,
      );
    }

    if (intent === 'CONVERSATIONAL') {
      if (!inWorkspace && scope === 'OUT_OF_SCOPE') {
        return {
          answer: this.config.appScopeReply,
          context: '',
          validated: { isValid: true, warning: null },
        };
      }
      this.logger.log(
        'Intent classified as CONVERSATIONAL. Skipping tools/search.',
      );

      const history = await this.getFormattedHistory(chatId, 10);
      const conversationalMessages =
        this.promptService.buildConversationalMessages(history, question, scope === 'OUT_OF_SCOPE');
      const conversationalLlm = await this.llmGateway.getSpeedyLLM();

      const answer = await conversationalLlm
        .pipe(new StringOutputParser())
        .invoke(conversationalMessages);

      return {
        answer,
        context: '',
        validated: { isValid: true, warning: null },
      };
    }

    if (scope === 'OUT_OF_SCOPE' && !inWorkspace) {
      return {
        answer: this.config.appScopeReply,
        context: '',
        validated: { isValid: true, warning: null },
      };
    }

    if (inWorkspace) {
      const workspaceId = String(filters!.workspaceId);
      return this.getAIResponseWithTools(chatId, question, workspaceId);
    }
    return this.getAIResponseWithSearch(chatId, question, filters);
  }
}
