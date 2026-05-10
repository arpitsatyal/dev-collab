import { SearchHit } from './retrieval.port';
import type { IAiResult } from '../types/ai.types';
import { LlmModel } from '../orchestrator/llm/llm.types';

export abstract class GenerationPort {
  abstract generateAnswer(
    llm: LlmModel,
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
  ): Promise<IAiResult>;
}
