import { Injectable } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AnswerPayload, GenerationPort } from '../ports/generation.port';
import { SearchHit } from '../ports/retrieval.port';

@Injectable()
export class GenerationService implements GenerationPort {
  improveResponseWithCitations(answer: string, filteredResults: SearchHit[]) {
    if (filteredResults.length > 0 && !answer.includes('Source:')) {
      const sources = [
        ...new Set(
          filteredResults.map(
            ({ doc }) => doc.metadata?.type || 'Documentation',
          ),
        ),
      ];

      const containsInfo = !answer
        .toLowerCase()
        .includes("i don't have information");
      if (containsInfo) {
        answer += `\n\n_Sources: ${sources.join(', ')}_`;
      }
    }

    return answer;
  }

  async generateAnswer(
    llm: BaseChatModel,
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
  ): Promise<AnswerPayload> {
    const answer = await llm.pipe(new StringOutputParser()).invoke(prompt);

    const improved = this.improveResponseWithCitations(answer, filteredResults);
    const sources = filteredResults.map(
      ({ doc }) => doc.metadata?.type || 'Unknown',
    );

    return { answer: improved, context, sources };
  }
}
