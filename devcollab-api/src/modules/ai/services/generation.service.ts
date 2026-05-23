import { Injectable } from '@nestjs/common';
import { LlmGateway } from '../orchestrator/llm/llm.types';
import { GenerationPort, GenerationTask } from '../ports/generation.port';
import { SearchHit } from '../ports/retrieval.port';
import { IAiResult } from '../types/ai.types';

@Injectable()
export class GenerationService implements GenerationPort {
  constructor(private readonly llmFactory: LlmGateway) { }

  private improveResponseWithCitations(answer: string, filteredResults: SearchHit[]) {
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
    prompt: string,
    context: string,
    filteredResults: SearchHit[],
    task: GenerationTask = 'reasoning',
  ): Promise<IAiResult> {
    const llm =
      task === 'speedy'
        ? await this.llmFactory.getSpeedyLLM()
        : await this.llmFactory.getReasoningLLM();

    const answer = await llm.generateText(prompt);

    const improved = this.improveResponseWithCitations(answer, filteredResults);
    const sources = filteredResults.map(
      ({ doc }) => doc.metadata?.type || 'Unknown',
    );

    return { answer: improved, context, sources };
  }

  async generateText(
    input: string | any[],
    task: GenerationTask = 'reasoning',
  ): Promise<string> {
    const llm =
      task === 'speedy'
        ? await this.llmFactory.getSpeedyLLM()
        : await this.llmFactory.getReasoningLLM();

    return llm.generateText(input);
  }

  async generateStructured<T>(
    input: string | any[],
    schema: any,
    name: string,
    task: GenerationTask = 'reasoning',
  ): Promise<T> {
    const llm = await this.llmFactory.getReasoningStructuredLLM(schema, name);
    return llm.invoke(input) as Promise<T>;
  }
}
