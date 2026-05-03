import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { LlmProviderPort } from '../ports/llm-provider.port';
import { LlmModel } from '../interfaces/llm.interfaces';
import { LlmTaskType } from '../enums/llm-task-type.enum';

@Injectable()
export class GroqLlmAdapter implements LlmProviderPort {
  constructor(private readonly configService: ConfigService) {}

  create(type?: LlmTaskType): LlmModel {
    const apiKey = this.configService.getOrThrow<string>('GROQ_API_KEY');

    // Select model based on task type
    const modelName = type === LlmTaskType.SPEEDY 
      ? 'llama-3.1-8b-instant' 
      : 'llama-3.1-70b-versatile';

    return new ChatOpenAI({
      modelName,
      apiKey,
      configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
      },
      maxTokens: 4096,
      temperature: 0,
    }) as unknown as LlmModel;
  }
}
