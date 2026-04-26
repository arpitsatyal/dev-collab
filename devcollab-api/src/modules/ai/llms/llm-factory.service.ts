import { Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableLike } from '@langchain/core/runnables';
import { StructuredTool } from '@langchain/core/tools';
import { GroqLlmService } from './groq-llm.service';
import { TogetherLlmService } from './together-llm.service';
import { LlmGateway } from '../ports/llm.port';
import { ConfigService } from '@nestjs/config';

export enum LlmProvider {
  GROQ = 'groq',
  TOGETHER = 'together',
}

interface ProviderContext {
  primary: GroqLlmService | TogetherLlmService;
  secondary: GroqLlmService | TogetherLlmService;
  primaryType: LlmProvider;
  secondaryType: LlmProvider;
  primaryFailed: boolean;
  secondaryFailed: boolean;
  markPrimaryFailed: () => void;
  markSecondaryFailed: () => void;
}

@Injectable()
export class LlmFactoryService implements LlmGateway {
  private readonly logger = new Logger(LlmFactoryService.name);

  private togetherFailed = false;
  private groqFailed = false;

  constructor(
    private readonly togetherLlmService: TogetherLlmService,
    private readonly groqLlmService: GroqLlmService,
    private readonly configService: ConfigService,
  ) { }

  private getProviderContext(): ProviderContext {
    const preferred = this.configService.get<LlmProvider>('PREFERRED_LLM_PROVIDER') || LlmProvider.GROQ;

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

  private handleLlmError(type: LlmProvider, error: any, markFailed: () => void) {
    const errorMessage = error?.message || String(error);
    const statusCode = (error as any)?.status || (error as any)?.statusCode;
    
    this.logger.error(`LLM Provider ${type} failed [Status: ${statusCode || 'unknown'}]: ${errorMessage}`);

    // Check for specific failure codes: 402 (Payment), 401 (Auth)
    if (statusCode === 402 || statusCode === 401 || errorMessage.includes('Credit limit')) {
      this.logger.warn(`Provider ${type} has a permanent adapter issue. Disabling for this session.`);
      markFailed();
    }
  }

  async getReasoningLLM(): Promise<BaseChatModel> {
    const ctx = this.getProviderContext();

    if (ctx.primaryFailed && ctx.secondaryFailed) {
      this.logger.error('CRITICAL: All LLM providers have failed.');
      return ctx.primary.create();
    }

    if (ctx.primaryFailed) return ctx.secondary.create();

    const p = ctx.primary.create().withListeners({
      onError: (error) => this.handleLlmError(ctx.primaryType, error, ctx.markPrimaryFailed),
    });

    if (ctx.secondaryFailed) return p as unknown as BaseChatModel;

    const s = ctx.secondary.create().withListeners({
      onStart: () => this.logger.log(`Fallback triggered: Switching to ${ctx.secondaryType}`),
      onError: (error) => this.handleLlmError(ctx.secondaryType, error, ctx.markSecondaryFailed),
    });

    return p.withFallbacks({
      fallbacks: [s],
    }) as unknown as BaseChatModel;
  }

  async getSpeedyLLM(): Promise<BaseChatModel> {
    return this.getReasoningLLM();
  }

  async getReasoningStructuredLLM(
    schema: any,
    name: string,
  ): Promise<RunnableLike<any, any>> {
    const ctx = this.getProviderContext();

    if (ctx.primaryFailed) {
      return (ctx.secondary.create() as any).withStructuredOutput(schema, { name });
    }

    const p = (ctx.primary.create() as any).withStructuredOutput(schema, { name }).withListeners({
      onError: (error) => this.handleLlmError(ctx.primaryType, error, ctx.markPrimaryFailed),
    });

    if (ctx.secondaryFailed) return p;

    const s = (ctx.secondary.create() as any).withStructuredOutput(schema, { name }).withListeners({
      onStart: () => this.logger.log(`Fallback Structured triggered: Switching to ${ctx.secondaryType}`),
      onError: (error) => this.handleLlmError(ctx.secondaryType, error, ctx.markSecondaryFailed),
    });

    return p.withFallbacks({
      fallbacks: [s],
    });
  }

  async getReasoningToolBoundLLM(
    tools: StructuredTool[],
  ): Promise<BaseChatModel> {
    const ctx = this.getProviderContext();

    if (ctx.primaryFailed) {
      return ctx.secondary.create().bindTools(tools) as unknown as BaseChatModel;
    }

    const p = ctx.primary.create().bindTools(tools).withListeners({
      onError: (error) => this.handleLlmError(ctx.primaryType, error, ctx.markPrimaryFailed),
    });

    if (ctx.secondaryFailed) return p as unknown as BaseChatModel;

    const s = ctx.secondary.create().bindTools(tools).withListeners({
      onStart: () => this.logger.log(`Fallback ToolBound triggered: Switching to ${ctx.secondaryType}`),
      onError: (error) => this.handleLlmError(ctx.secondaryType, error, ctx.markSecondaryFailed),
    });

    return p.withFallbacks({
      fallbacks: [s],
    }) as unknown as BaseChatModel;
  }
}
