import { Module } from '@nestjs/common';
import { LlmFactoryService } from './llm-factory.service';
import { GroqLlmAdapter } from './adapters/groq-llm.adapter';
import { TogetherLlmAdapter } from './adapters/together-llm.adapter';
import { LlmGateway } from './ports/llm.port';

@Module({
  providers: [
    { provide: LlmGateway, useClass: LlmFactoryService },
    GroqLlmAdapter,
    TogetherLlmAdapter,
  ],
  exports: [LlmGateway],
})
export class LlmModule { }
