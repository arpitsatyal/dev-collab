import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { LlmProviderPort } from '../ports/llm-provider.port';
import { LlmModel } from '../interfaces/llm.interfaces';
import { LlmTaskType } from '../enums/llm-task-type.enum';

@Injectable()
export class TogetherLlmAdapter implements LlmProviderPort {
  constructor(private readonly configService: ConfigService) {}

  create(type?: LlmTaskType): LlmModel {
    const apiKey = this.configService.getOrThrow<string>('TOGETHER_API_KEY');

    // Select model based on task type
    const modelName = type === LlmTaskType.SPEEDY
      ? 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
      : 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';

    return new ChatOpenAI({
      apiKey,
      modelName,
      configuration: {
        baseURL: 'https://api.together.xyz/v1',
      },
      maxTokens: 3072,
      temperature: 0.7,
    }) as unknown as LlmModel;
  }
}
