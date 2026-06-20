import { Injectable, Logger } from '@nestjs/common';
import { ChatContextService } from './chat-context.service';
import { ChatIntentService } from './chat-intent.service';
import { ChatConversationalHandler } from 'src/modules/chat/handlers/conversational.handler';
import { ChatWorkspaceQueryHandler } from 'src/modules/chat/handlers/workspace-query.handler';
import { GetAiResponseRequest } from 'src/modules/ai/types/ai.types';
import { IChatResponse } from 'src/modules/chat/types/ai-chat.interface';

@Injectable()
export class ChatEngineService {
  private readonly logger = new Logger(ChatEngineService.name);

  constructor(
    private readonly contextService: ChatContextService,
    private readonly intentService: ChatIntentService,
    private readonly conversationalHandler: ChatConversationalHandler,
    private readonly workspaceQueryHandler: ChatWorkspaceQueryHandler,
  ) { }

  /**
   * Main entry point for AI responses.
   * Acts as an orchestrator for intent classification and delegation.
   */
  async getAIResponse(request: GetAiResponseRequest): Promise<IChatResponse> {
    const { chatId, question, filters } = request;

    // 1. Prepare Context (Infrastructure)
    const history = await this.contextService.getFormattedHistory(chatId, 10);
    const context = this.contextService.createChatContext(
      chatId,
      question,
      history,
      filters,
    );

    // 2. Classify Intent (Reasoning)
    const { intent, scope } = await this.intentService.classifyIntent(context);

    // 3. Delegate to Specialized Handler (Strategy Pattern)
    if (intent === 'CONVERSATIONAL') {
      return this.conversationalHandler.handle(context, scope);
    }

    return this.workspaceQueryHandler.handle(context);
  }
}
