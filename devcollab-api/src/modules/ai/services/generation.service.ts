import { Injectable } from '@nestjs/common';
import { LlmModel } from '../orchestrator/llm/llm.types';
import { GenerationPort } from '../ports/generation.port';
import { SearchHit } from '../ports/retrieval.port';
import { IAiResult } from '../interfaces';

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
    llm: LlmModel,
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
  ): Promise<IAiResult> {
    const answer = await llm.generateText(prompt);

    const improved = this.improveResponseWithCitations(answer, filteredResults);
    const sources = filteredResults.map(
      ({ doc }) => doc.metadata?.type || 'Unknown',
    );

    return { answer: improved, context, sources };
  }
}
