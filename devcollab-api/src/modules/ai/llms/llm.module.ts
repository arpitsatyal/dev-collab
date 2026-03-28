import { Module } from '@nestjs/common';
import { LlmFactoryService } from './llm-factory.service';
import { GroqLlmService } from './groq-llm.service';
import { TogetherLlmService } from './together-llm.service';

import { LlmGateway } from '../ports/llm.port';

@Module({
  providers: [
    { provide: LlmGateway, useClass: LlmFactoryService },
    GroqLlmService,
    TogetherLlmService,
  ],
  exports: [LlmGateway],
})
export class LlmModule {}
