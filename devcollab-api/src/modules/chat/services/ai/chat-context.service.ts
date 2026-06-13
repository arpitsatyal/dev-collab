import { Injectable } from '@nestjs/common';
import { MessageService } from 'src/modules/message/message.service';
import { IChatContext } from 'src/modules/chat/types/ai-chat.interface';

@Injectable()
export class ChatContextService {
  constructor(private readonly messageService: MessageService) { }

  /**
   * Fetches and formats the recent chat history into a string.
   */
  async getFormattedHistory(
    chatId: string,
    limit: number = 10,
  ): Promise<string> {
    const messages = await this.messageService.getHistory(chatId, limit);
    return messages
      .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
      .join('\n');
  }

  /**
   * Builds the chat context object from request parameters.
   */
  createChatContext(
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
}
