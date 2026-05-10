import { SearchHit } from './retrieval.port';
import type { IAiResult } from '../types/ai.types';

export type GenerationTask = 'reasoning' | 'speedy';

export abstract class GenerationPort {
  abstract generateAnswer(
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
    task?: GenerationTask,
  ): Promise<IAiResult>;

  abstract generateText(
    input: string | any[],
    task?: GenerationTask,
  ): Promise<string>;
}
