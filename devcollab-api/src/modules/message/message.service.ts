import { Injectable } from '@nestjs/common';
import { MessageRepository } from './repositories/message.repository';

@Injectable()
export class MessageService {
  constructor(private readonly repo: MessageRepository) {}

  async saveUserMessage(chatId: string, content: string) {
    return this.repo.create({ chatId, content, isUser: true });
  }

  async saveAiMessage(chatId: string, content: string) {
    return this.repo.create({ chatId, content, isUser: false });
  }

  async getHistory(chatId: string, limit: number) {
    return this.repo.findByChatId(chatId, limit);
  }
}
