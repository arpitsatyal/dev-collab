import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SearchHit } from './retrieval.port';
import { IAiResult } from '../interfaces';

export abstract class GenerationPort {
  abstract generateAnswer(
    llm: BaseChatModel,
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
  ): Promise<IAiResult>;
}
