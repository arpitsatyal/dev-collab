import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SearchHit } from './retrieval.port';

export interface AnswerPayload {
  answer: string;
  context: string;
  sources?: string[];
}

export abstract class GenerationPort {
  abstract generateAnswer(
    llm: BaseChatModel,
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
  ): Promise<AnswerPayload>;
}
