import { Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableLike } from '@langchain/core/runnables';
import { StructuredTool } from '@langchain/core/tools';
import { GroqLlmService } from './groq-llm.service';
import { TogetherLlmService } from './together-llm.service';
import { LlmGateway } from '../ports/llm.port';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from './enums/llm-provider.enum';
import type { ProviderContext } from './interfaces/provider-context.interface';

@Injectable()
export class LlmFactoryService implements LlmGateway {
  private readonly logger = new Logger(LlmFactoryService.name);

  private togetherFailed = false;
  private groqFailed = false;

  constructor(
    private readonly togetherLlmService: TogetherLlmService,
    private readonly groqLlmService: GroqLlmService,
    private readonly configService: ConfigService,
  ) {}

  private getProviderContext(): ProviderContext {
    const preferred =
      this.configService.get<LlmProvider>('PREFERRED_LLM_PROVIDER') ||
      LlmProvider.GROQ;

    if (preferred === LlmProvider.TOGETHER) {
      return {
        primary: this.togetherLlmService,
        secondary: this.groqLlmService,
        primaryType: LlmProvider.TOGETHER,
        secondaryType: LlmProvider.GROQ,
        primaryFailed: this.togetherFailed,
        secondaryFailed: this.groqFailed,
        markPrimaryFailed: () => (this.togetherFailed = true),
        markSecondaryFailed: () => (this.groqFailed = true),
      };
    }

    return {
      primary: this.groqLlmService,
      secondary: this.togetherLlmService,
      primaryType: LlmProvider.GROQ,
      secondaryType: LlmProvider.TOGETHER,
      primaryFailed: this.groqFailed,
      secondaryFailed: this.togetherFailed,
      markPrimaryFailed: () => (this.groqFailed = true),
      markSecondaryFailed: () => (this.togetherFailed = true),
    };
  }

  private handleLlmError(
    type: LlmProvider,
    error: any,
    markFailed: () => void,
  ) {
    const errorMessage = error?.message || String(error);
    const statusCode = (error as any)?.status || (error as any)?.statusCode;

    this.logger.error(
      `LLM Provider ${type} failed [Status: ${statusCode || 'unknown'}]: ${errorMessage}`,
    );

    // Check for specific failure codes: 402 (Payment), 401 (Auth)
    if (
      statusCode === 402 ||
      statusCode === 401 ||
      errorMessage.includes('Credit limit')
    ) {
      this.logger.warn(
        `Provider ${type} has a permanent adapter issue. Disabling for this session.`,
      );
      markFailed();
    }
  }

  private async withProviderLogic<T>(
    factory: (llm: GroqLlmService | TogetherLlmService, type: LlmProvider) => T,
    fallbackLabel: string,
  ): Promise<T> {
    const ctx = this.getProviderContext();

    if (ctx.primaryFailed && ctx.secondaryFailed) {
      this.logger.error('CRITICAL: All LLM providers have failed.');
      return factory(ctx.primary, ctx.primaryType);
    }

    if (ctx.primaryFailed) {
      return factory(ctx.secondary, ctx.secondaryType);
    }

    const primaryModel = factory(ctx.primary, ctx.primaryType);
    const p = (primaryModel as any).withListeners({
      onError: (error: any) =>
        this.handleLlmError(ctx.primaryType, error, ctx.markPrimaryFailed),
    });

    if (ctx.secondaryFailed) return p;

    const secondaryModel = factory(ctx.secondary, ctx.secondaryType);
    const s = (secondaryModel as any).withListeners({
      onStart: () =>
        this.logger.log(
          `Fallback ${fallbackLabel} triggered: Switching to ${ctx.secondaryType}`,
        ),
      onError: (error: any) =>
        this.handleLlmError(ctx.secondaryType, error, ctx.markSecondaryFailed),
    });

    return p.withFallbacks({
      fallbacks: [s],
    });
  }

  async getReasoningLLM(): Promise<BaseChatModel> {
    return this.withProviderLogic(
      (llm) => llm.create(),
      'Reasoning',
    ) as unknown as BaseChatModel;
  }

  async getSpeedyLLM(): Promise<BaseChatModel> {
    return this.getReasoningLLM();
  }

  async getReasoningStructuredLLM(
    schema: any,
    name: string,
  ): Promise<RunnableLike<any, any>> {
    return this.withProviderLogic(
      (llm) => (llm.create() as any).withStructuredOutput(schema, { name }),
      'Structured',
    );
  }

  async getReasoningToolBoundLLM(
    tools: StructuredTool[],
  ): Promise<BaseChatModel> {
    return this.withProviderLogic(
      (llm) => llm.create().bindTools(tools),
      'ToolBound',
    ) as unknown as BaseChatModel;
  }
}
