import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GroqLlmService {
  constructor(private configService: ConfigService) {}

  create() {
    return new ChatOpenAI({
      modelName: 'meta-llama/llama-4-scout-17b-16e-instruct',
      apiKey: this.configService.getOrThrow<string>('GROQ_API_KEY'),
      configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
      },
      maxTokens: 4096,
      temperature: 0.7,
    });
  }
}
