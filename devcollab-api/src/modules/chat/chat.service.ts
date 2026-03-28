import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatRepository } from './repositories/chat.repository';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepo: ChatRepository) {}

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
