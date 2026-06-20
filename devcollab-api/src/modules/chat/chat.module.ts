import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatController } from './chat.controller';
import { ChatContextService } from './services/ai/chat-context.service';
import { ChatIntentService } from './services/ai/chat-intent.service';
import { ChatConversationalHandler } from './handlers/conversational.handler';
import { ChatWorkspaceQueryHandler } from './handlers/workspace-query.handler';
import { ChatEngineService } from './services/ai/chat-engine.service';
import { AgentModule } from '../ai/agent/agent.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [AgentModule, MessageModule],
  providers: [
    ChatService,
    ChatContextService,
    ChatIntentService,
    ChatConversationalHandler,
    ChatWorkspaceQueryHandler,
    ChatEngineService,
  ],
  controllers: [ChatController],
  exports: [ChatService, ChatEngineService],
})
export class ChatModule { }
