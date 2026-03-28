import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';
import { ChatEngineService } from './services/chat-engine.service';
import { SuggestionService } from './services/suggestion.service';
import { MessageModule } from '../message/message.module';
import { WorkItemsModule } from '../work-items/work-items.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SnippetRepository } from '../snippets/repositories/snippet.repository';
import { DocRepository } from '../docs/repositories/doc.repository';
import { WorkItemRepository } from '../work-items/repositories/work-item.repository';
import { LangGraphService } from './services/lang-graph.service';
import { LlmModule } from './llms/llm.module';
import { VectorStoreModule } from 'src/common/vector-store/vector-store.module';
import { AiConfig } from './ai.config';
import { GenerationPort } from './ports/generation.port';
import { PromptPort } from './ports/prompt.port';
import { ToolRegistry } from './ports/tool.port';
import { RetrievalPort } from './ports/retrieval.port';
import { AgentPort } from './ports/agent.port';
import { GenerationService } from './services/generation.service';
import { PromptService } from './services/prompt.service';
import { RetrievalService } from './services/retrieval.service';
import { ToolService } from './services/tool.service';

@Module({
  imports: [MessageModule, WorkItemsModule, LlmModule, VectorStoreModule, WorkspacesModule],
  providers: [
    AiConfig,
    AiService,
    ChatEngineService,
    SuggestionService,
    { provide: GenerationPort, useClass: GenerationService },
    { provide: PromptPort, useClass: PromptService },
    { provide: RetrievalPort, useClass: RetrievalService },
    { provide: ToolRegistry, useClass: ToolService },
    { provide: AgentPort, useClass: LangGraphService },
    SnippetRepository,
    DocRepository,
    WorkItemRepository,
  ],
  controllers: [AiController],
})
export class AiModule { }
