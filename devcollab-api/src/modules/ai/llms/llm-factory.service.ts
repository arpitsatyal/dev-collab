import { Injectable, Logger } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { GroqLlmAdapter } from './adapters/groq-llm.adapter';
import { TogetherLlmAdapter } from './adapters/together-llm.adapter';
import { LlmGateway } from './ports/llm.port';
import { LlmProviderPort } from './ports/llm-provider.port';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from './enums/llm-provider.enum';
import { LlmTaskType } from './enums/llm-task-type.enum';
import { LlmModel, StructuredLlm, ToolBoundLlm, LlmRunnable, LlmStructuredSchema } from './interfaces/llm.interfaces';
import type { ProviderContext } from './interfaces/provider-context.interface';

@Injectable()
export class LlmFactoryService implements LlmGateway {
  private readonly logger = new Logger(LlmFactoryService.name);

  private togetherFailed = false;
  private groqFailed = false;

  constructor(
    private readonly togetherLlmAdapter: TogetherLlmAdapter,
    private readonly groqLlmAdapter: GroqLlmAdapter,
    private readonly configService: ConfigService,
  ) { }

  private getProviderContext(): ProviderContext {
    const primaryType = this.configService.get<LlmProvider>('PREFERRED_LLM_PROVIDER') || LlmProvider.GROQ;
    const secondaryType = primaryType === LlmProvider.TOGETHER ? LlmProvider.GROQ : LlmProvider.TOGETHER;

    const resolve = (type: LlmProvider) => ({
      adapter: type === LlmProvider.TOGETHER ? this.togetherLlmAdapter : this.groqLlmAdapter,
      type,
      failed: type === LlmProvider.TOGETHER ? this.togetherFailed : this.groqFailed,
      markFailed: () => (type === LlmProvider.TOGETHER ? (this.togetherFailed = true) : (this.groqFailed = true)),
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

  private async withProviderLogic(
    factory: (llm: LlmProviderPort, type: LlmProvider) => LlmRunnable,
    taskType: LlmTaskType,
  ): Promise<LlmRunnable> {
    const ctx = this.getProviderContext();

    if (ctx.primaryFailed && ctx.secondaryFailed) {
      this.logger.error('CRITICAL: All LLM providers have failed.');
      return factory(ctx.primary, ctx.primaryType);
    }

    if (ctx.primaryFailed) {
      return factory(ctx.secondary, ctx.secondaryType);
    }

    const primaryModel = factory(ctx.primary, ctx.primaryType);
    const p = primaryModel.withListeners({
      onError: (error: any) =>
        this.handleLlmError(ctx.primaryType, error, ctx.markPrimaryFailed),
    });

    if (ctx.secondaryFailed) return p;

    const secondaryModel = factory(ctx.secondary, ctx.secondaryType);
    const s = secondaryModel.withListeners({
      onStart: () =>
        this.logger.log(
          `Fallback ${taskType} triggered: Switching to ${ctx.secondaryType}`,
        ),
      onError: (error: any) =>
        this.handleLlmError(ctx.secondaryType, error, ctx.markSecondaryFailed),
    });
    return p.withFallbacks({
      fallbacks: [s],
    }) as LlmRunnable;
  }

  /**
   * Helper to execute a provider task with resilience and automatic type casting.
   */
  private async executeTask<T extends LlmRunnable>(
    taskType: LlmTaskType,
    recipe: (provider: LlmProviderPort) => T,
  ): Promise<T> {
    const model = await this.withProviderLogic(
      (provider) => recipe(provider),
      taskType,
    );
    return model as unknown as T;
  }

  async getReasoningLLM(): Promise<LlmModel> {
    return this.executeTask(LlmTaskType.REASONING, (p) => p.create(LlmTaskType.REASONING));
  }

  async getSpeedyLLM(): Promise<LlmModel> {
    return this.executeTask(LlmTaskType.SPEEDY, (p) => p.create(LlmTaskType.SPEEDY));
  }

  async getReasoningStructuredLLM(
    schema: LlmStructuredSchema,
    name: string,
  ): Promise<StructuredLlm> {
    return this.executeTask(LlmTaskType.STRUCTURED, (p) =>
      p.create(LlmTaskType.STRUCTURED).withStructuredOutput(schema, { name }),
    );
  }

  async getReasoningToolBoundLLM(
    tools: StructuredTool[],
  ): Promise<ToolBoundLlm> {
    return this.executeTask(LlmTaskType.TOOL_BOUND, (p) =>
      p.create(LlmTaskType.TOOL_BOUND).bindTools(tools),
    );
  }
}
