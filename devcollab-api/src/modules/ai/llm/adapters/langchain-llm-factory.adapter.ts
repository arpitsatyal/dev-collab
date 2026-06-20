import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmGateway,
  LlmProviderPort,
  LlmModel,
  StructuredLlm,
  ToolEnabledLlm,
  LlmStructuredSchema,
  ProviderContext,
} from '../llm.types';
import { LlmProvider, LlmTaskType } from '../llm.enums';
import { IAiTool } from 'src/modules/ai/tools/ports/tools.port';
import { GroqLlmAdapter } from './groq-llm.adapter';
import { TogetherLlmAdapter } from './together-llm.adapter';
import { LangChainLlmWrapper } from './langchain-llm.wrapper';

@Injectable()
export class LangChainLlmFactoryAdapter implements LlmGateway {
  private readonly logger = new Logger(LangChainLlmFactoryAdapter.name);

  private togetherFailed = false;
  private groqFailed = false;

  constructor(
    private readonly togetherLlmAdapter: TogetherLlmAdapter,
    private readonly groqLlmAdapter: GroqLlmAdapter,
    private readonly configService: ConfigService,
  ) {}

  private getProviderContext(): ProviderContext {
    const primaryType =
      this.configService.get<LlmProvider>('PREFERRED_LLM_PROVIDER') ||
      LlmProvider.GROQ;
    const secondaryType =
      primaryType === LlmProvider.TOGETHER
        ? LlmProvider.GROQ
        : LlmProvider.TOGETHER;

    const resolve = (type: LlmProvider) => ({
      adapter:
        type === LlmProvider.TOGETHER
          ? this.togetherLlmAdapter
          : this.groqLlmAdapter,
      type,
      failed:
        type === LlmProvider.TOGETHER ? this.togetherFailed : this.groqFailed,
      markFailed: () =>
        type === LlmProvider.TOGETHER
          ? (this.togetherFailed = true)
          : (this.groqFailed = true),
    });

    const primary = resolve(primaryType);
    const secondary = resolve(secondaryType);

    return {
      primary: primary.adapter,
      secondary: secondary.adapter,
      primaryType: primary.type,
      secondaryType: secondary.type,
      primaryFailed: primary.failed,
      secondaryFailed: secondary.failed,
      markPrimaryFailed: primary.markFailed,
      markSecondaryFailed: secondary.markFailed,
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

  private async withProviderLogic(
    factory: (llm: LlmProviderPort, type: LlmProvider) => LlmModel,
    taskType: LlmTaskType,
  ): Promise<LlmModel> {
    const ctx = this.getProviderContext();

    if (ctx.primaryFailed && ctx.secondaryFailed) {
      this.logger.error('CRITICAL: All LLM providers have failed.');
      return factory(ctx.primary, ctx.primaryType);
    }

    // Only one provider available
    if (ctx.primaryFailed) {
      return factory(ctx.secondary, ctx.secondaryType);
    }
    if (ctx.secondaryFailed) {
      return factory(ctx.primary, ctx.primaryType);
    }

    // Both available - setup internal fallback config
    const primaryWrapper = factory(
      ctx.primary,
      ctx.primaryType,
    ) as LangChainLlmWrapper;
    const secondaryWrapper = factory(
      ctx.secondary,
      ctx.secondaryType,
    ) as LangChainLlmWrapper;

    return new LangChainLlmWrapper({
      primary: primaryWrapper.getRawModel(),
      secondary: secondaryWrapper.getRawModel(),
      primaryListeners: {
        onError: (error: any) =>
          this.handleLlmError(ctx.primaryType, error, ctx.markPrimaryFailed),
      },
      secondaryListeners: {
        onStart: () =>
          this.logger.log(
            `Fallback ${taskType} triggered: Switching to ${ctx.secondaryType}`,
          ),
        onError: (error: any) =>
          this.handleLlmError(
            ctx.secondaryType,
            error,
            ctx.markSecondaryFailed,
          ),
      },
    });
  }

  async getReasoningLLM(): Promise<LlmModel> {
    return this.withProviderLogic((p) => p.create(), LlmTaskType.REASONING);
  }

  async getSpeedyLLM(): Promise<LlmModel> {
    return this.withProviderLogic(
      (p) => p.create(LlmTaskType.SPEEDY),
      LlmTaskType.SPEEDY,
    );
  }

  async getReasoningStructuredLLM(
    schema: LlmStructuredSchema,
    name: string,
  ): Promise<StructuredLlm> {
    const model = await this.withProviderLogic(
      (p) => p.create(),
      LlmTaskType.STRUCTURED,
    );
    return model.withStructuredOutput(schema);
  }

  async getReasoningToolBoundLLM(tools: IAiTool[]): Promise<ToolEnabledLlm> {
    const model = await this.withProviderLogic(
      (p) => p.create(),
      LlmTaskType.TOOL_BOUND,
    );
    return model.bindTools(tools);
  }
}
