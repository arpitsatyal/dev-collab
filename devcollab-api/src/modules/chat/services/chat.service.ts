import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatRepository } from '../repositories/chat.repository';
import { MessageService } from 'src/modules/message/message.service';
import { ChatEngineService } from './ai/chat-engine.service';
import { GetAiResponseRequest } from 'src/modules/ai/types/ai.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly messageService: MessageService,
    private readonly chatEngineService: ChatEngineService,
  ) { }

  async ask(request: GetAiResponseRequest) {
    const { chatId, question, filters } = request;

    await this.messageService.saveUserMessage(chatId, question);

    const { answer } = await this.chatEngineService.getAIResponse({
      chatId,
      question,
      filters,
    });

    await this.messageService.saveAiMessage(chatId, answer);

    return { answer };
  }

  async getChatById(chatId: string) {
    const chat = await this.chatRepo.findUnique(chatId);

    if (!chat) {
      throw new NotFoundException(`Chat with id ${chatId} not found`);
    }

    return chat;
  }

  async getChatsForUser(userId: string) {
    return this.chatRepo.findManyBySender(userId);
  }

  async createChat(senderId: string) {
    return this.chatRepo.create({ senderId });
  }

  async deleteChat(chatId: string) {
    await this.chatRepo.delete(chatId);
    return { success: true };
  }
}
