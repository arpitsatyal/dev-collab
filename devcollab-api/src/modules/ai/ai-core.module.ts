import { Module, Global } from '@nestjs/common';
import { AiConfig } from './ai.config';
import { LlmModule } from './llms/llm.module';
import { VectorStoreModule } from 'src/common/vector-store/vector-store.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { GenerationPort } from './ports/generation.port';
import { PromptPort } from './ports/prompt.port';
import { ToolRegistry } from './ports/tool.port';
import { RetrievalPort } from './ports/retrieval.port';
import { GenerationService } from './services/generation.service';
import { PromptService } from './services/prompt.service';
import { RetrievalService } from './services/retrieval.service';
import { ToolService } from './services/tool.service';
import { SnippetsModule } from '../snippets/snippets.module';
import { DocsModule } from '../docs/docs.module';
import { WorkItemsModule } from '../work-items/work-items.module';

@Global()
@Module({
  imports: [
    LlmModule,
    VectorStoreModule,
    WorkspacesModule,
    SnippetsModule,
    DocsModule,
    WorkItemsModule,
  ],
  providers: [
    AiConfig,
    { provide: GenerationPort, useClass: GenerationService },
    { provide: PromptPort, useClass: PromptService },
    { provide: RetrievalPort, useClass: RetrievalService },
    { provide: ToolRegistry, useClass: ToolService },
  ],
  exports: [
    AiConfig,
    LlmModule,
    VectorStoreModule,
    WorkspacesModule,
    GenerationPort,
    PromptPort,
    RetrievalPort,
    ToolRegistry,
    SnippetsModule,
    DocsModule,
    WorkItemsModule,
  ],
})
export class AiCoreModule { }
