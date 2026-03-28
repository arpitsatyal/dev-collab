import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TogetherLlmService {
  constructor(private configService: ConfigService) {}

  create() {
    return new ChatOpenAI({
      modelName: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      apiKey: this.configService.getOrThrow<string>('TOGETHER_API_KEY'),
      configuration: {
        baseURL: 'https://api.together.xyz/v1',
      },
      maxTokens: 3072,
      temperature: 0.7,
    });
  }
}
