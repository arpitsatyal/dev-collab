import { Module } from '@nestjs/common';
import { LlmGateway } from './llm.types';
import { LangChainLlmFactoryAdapter } from './adapters/langchain-llm-factory.adapter';
import { GroqLlmAdapter } from './adapters/groq-llm.adapter';
import { TogetherLlmAdapter } from './adapters/together-llm.adapter';

@Module({
  providers: [
    GroqLlmAdapter,
    TogetherLlmAdapter,
    { provide: LlmGateway, useClass: LangChainLlmFactoryAdapter },
  ],
  exports: [LlmGateway],
})
export class LlmModule { }
