import { SearchHit } from './retrieval.port';
import type { IAiResult } from '../interfaces/ai.interfaces';
import { LlmModel } from '../llms/interfaces/llm.types';

export abstract class GenerationPort {
  abstract generateAnswer(
    llm: LlmModel,
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
  ): Promise<IAiResult>;
}
