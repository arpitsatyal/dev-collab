import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/common/guards/auth.guard';
import { ChatService } from './chat.service';
import { CurrentUser } from '../users/user.decorator';
import type { User } from '../../common/drizzle/schema';

@Controller('chats')
@UseGuards(SessionAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  getUserChats(@CurrentUser() user: User) {
    const userId = user.id;
    return this.chatService.getChatsForUser(userId);
  }

  @Get(':chatId')
  getChatById(@Param('chatId') chatId: string) {
    return this.chatService.getChatById(chatId);
  }

  @Post()
  createChat(@CurrentUser() user: User) {
    const userId = user.id;
    return this.chatService.createChat(userId);
  }

  @Delete(':chatId')
  deleteChat(@Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId);
  }
}
