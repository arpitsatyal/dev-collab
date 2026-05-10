import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';
import { SuggestionService } from './services/suggestion.service';
import { AgentModule } from './agent/agent.module';
import { WorkItemsModule } from '../work-items/work-items.module';
import { AiCoreModule } from './ai-core.module';

@Module({
  imports: [
    AiCoreModule,
    AgentModule,
    WorkItemsModule,
  ],
  providers: [AiService, SuggestionService],
  controllers: [AiController],
})
export class AiModule { }
