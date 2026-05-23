import { Module } from '@nestjs/common';
import { LlmGateway } from '../orchestrator/llm/llm.types';
import { LangChainLlmFactoryAdapter } from '../orchestrator/adapters/llm/langchain-llm-factory.adapter';
import { GroqLlmAdapter } from '../orchestrator/adapters/llm/groq-llm.adapter';
import { TogetherLlmAdapter } from '../orchestrator/adapters/llm/together-llm.adapter';

@Module({
  providers: [
    GroqLlmAdapter,
    TogetherLlmAdapter,
    { provide: LlmGateway, useClass: LangChainLlmFactoryAdapter },
  ],
  exports: [LlmGateway],
})
export class LlmModule { }
