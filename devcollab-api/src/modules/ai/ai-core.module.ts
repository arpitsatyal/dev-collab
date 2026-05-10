import { Module, Global } from '@nestjs/common';
import { AiConfig } from './ai.config';
import { VectorStoreModule } from 'src/common/vector-store/vector-store.module';
import { GenerationPort } from './ports/generation.port';
import { PromptPort } from './ports/prompt.port';
import { RetrievalPort } from './ports/retrieval.port';
import { GenerationService } from './services/generation.service';
import { PromptService } from './services/prompt.service';
import { RetrievalService } from './services/retrieval.service';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

@Global()
@Module({
  imports: [VectorStoreModule, OrchestratorModule],
  providers: [
    AiConfig,
    { provide: GenerationPort, useClass: GenerationService },
    { provide: PromptPort, useClass: PromptService },
    { provide: RetrievalPort, useClass: RetrievalService },
  ],
  exports: [
    AiConfig,
    OrchestratorModule,
    VectorStoreModule,
    GenerationPort,
    PromptPort,
    RetrievalPort,
  ],
})
export class AiCoreModule {}
