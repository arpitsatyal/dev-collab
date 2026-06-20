import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { LlmProviderPort, LlmModel } from '../llm.types';
import { LlmTaskType } from '../llm.enums';
import { LangChainLlmWrapper } from './langchain-llm.wrapper';

@Injectable()
export class TogetherLlmAdapter implements LlmProviderPort {
  constructor(private readonly configService: ConfigService) { }

  create(type?: LlmTaskType): LlmModel {
    const apiKey = this.configService.getOrThrow<string>('TOGETHER_API_KEY');

    const modelName = type === LlmTaskType.SPEEDY
      ? 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
      : 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';

    const model = new ChatOpenAI({
      apiKey,
      modelName,
      configuration: {
        baseURL: 'https://api.together.xyz/v1',
      },
      maxTokens: 3072,
      temperature: 0.7,
    });

    return new LangChainLlmWrapper({ primary: model });
  }
}
