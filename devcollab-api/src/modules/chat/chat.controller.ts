import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { SanitizeIdPipe } from 'src/common/pipes/sanitize-id.pipe';
import { ChatService } from './services/chat.service';
import { CurrentUser } from '../users/user.decorator';
import { ChatParamsDto } from './dto/chat.dto';
import type { User } from 'src/common/drizzle/schema';

@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) { }

  @Get()
  getUserChats(@CurrentUser() user: User) {
    const userId = user.id;
    return this.chatService.getChatsForUser(userId);
  }

  @Get(':chatId')
  getChatById(@Param() params: ChatParamsDto) {
    return this.chatService.getChatById(params.chatId);
  }

  @Post()
  createChat(@CurrentUser() user: User) {
    const userId = user.id;
    return this.chatService.createChat(userId);
  }

  @Post(':chatId/ask')
  ask(
    @Param('chatId', SanitizeIdPipe) chatId: string,
    @Body('question') question: string,
    @Query('workspaceId', SanitizeIdPipe) workspaceId?: string,
  ) {
    const filters = workspaceId ? { workspaceId } : undefined;
    return this.chatService.ask({
      chatId,
      question,
      filters,
    });
  }

  @Delete(':chatId')
  deleteChat(@Param() params: ChatParamsDto) {
    return this.chatService.deleteChat(params.chatId);
  }
}
