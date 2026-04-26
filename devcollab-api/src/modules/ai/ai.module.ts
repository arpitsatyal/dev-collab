import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';
import { ChatEngineService } from './services/chat-engine.service';
import { SuggestionService } from './services/suggestion.service';
import { MessageModule } from '../message/message.module';
import { AiCoreModule } from './ai-core.module';
import { AgentModule } from './agent/agent.module';
import { ToolsModule } from './tools/tools.module';
import { WorkItemsModule } from '../work-items/work-items.module';

@Module({
  imports: [
    AiCoreModule,
    ToolsModule,
    AgentModule,
    MessageModule,
    WorkItemsModule,
  ],
  providers: [
    AiService,
    ChatEngineService,
    SuggestionService,
  ],
  controllers: [AiController],
})

export class AiModule { }
