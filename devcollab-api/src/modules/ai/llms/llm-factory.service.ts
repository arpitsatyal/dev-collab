import { Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableLike } from '@langchain/core/runnables';
import { StructuredTool } from '@langchain/core/tools';
import { GroqLlmService } from './groq-llm.service';
import { TogetherLlmService } from './together-llm.service';
import { LlmGateway } from '../ports/llm.port';

@Injectable()
export class LlmFactoryService implements LlmGateway {
  private readonly logger = new Logger(LlmFactoryService.name);

  private togetherFailed = false;
  private groqFailed = false;

  constructor(
    private readonly togetherLlmService: TogetherLlmService,
    private readonly groqLlmService: GroqLlmService,
  ) {}

  async getReasoningLLM(): Promise<BaseChatModel> {
    if (this.groqFailed) {
      return this.togetherLlmService.create();
    }

    const primary = this.groqLlmService.create().withListeners({
      onError: (run: any) => {
        this.logger.warn(
          `Primary Reasoning (Groq) failed: ${run.error}. Switching to persistent fallback.`,
        );
        this.groqFailed = true;
      },
    });
    const fallback = this.togetherLlmService.create().withListeners({
      onStart: () => this.logger.log('Fallback Reasoning (Together) triggered!'),
      onError: (run: any) =>
        this.logger.error(`Fallback Reasoning (Together) failed: ${run.error}`),
    });

    return primary.withFallbacks({
      fallbacks: [fallback],
    }) as unknown as BaseChatModel;
  }

  async getSpeedyLLM(): Promise<BaseChatModel> {
    if (this.groqFailed) {
      return this.togetherLlmService.create();
    }

    const primary = this.groqLlmService.create().withListeners({
      onError: (run: any) => {
        this.logger.warn(
          `Primary Speedy (Groq) failed: ${run.error}. Switching to persistent fallback.`,
        );
        this.groqFailed = true;
      },
    });
    const fallback = this.togetherLlmService.create().withListeners({
      onStart: () => this.logger.log('Fallback Speedy (Together) triggered!'),
      onError: (run: any) =>
        this.logger.error(`Fallback Speedy (Together) failed: ${run.error}`),
    });

    return primary.withFallbacks({
      fallbacks: [fallback],
    }) as unknown as BaseChatModel;
  }

  async getReasoningStructuredLLM(
    schema: any,
    name: string,
  ): Promise<RunnableLike<any, any>> {
    if (this.groqFailed) {
      const fallback = this.togetherLlmService.create();
      return (fallback as any).withStructuredOutput(schema, { name });
    }

    const primary = this.groqLlmService.create();
    const fallback = this.togetherLlmService.create();

    const structuredPrimary = (primary as any)
      .withStructuredOutput(schema, { name })
      .withListeners({
        onError: (run: any) => {
          this.logger.warn(
            `Primary Structured (Groq) failed: ${run.error}. Switching to persistent fallback.`,
          );
          this.groqFailed = true;
        },
      });
    const structuredFallback = (fallback as any)
      .withStructuredOutput(schema, { name })
      .withListeners({
        onStart: () => this.logger.log('Fallback Structured (Together) triggered!'),
        onError: (run: any) =>
          this.logger.error(`Fallback Structured (Together) failed: ${run.error}`),
      });

    return structuredPrimary.withFallbacks({
      fallbacks: [structuredFallback],
    });
  }

  async getReasoningToolBoundLLM(
    tools: StructuredTool[],
  ): Promise<BaseChatModel> {
    if (this.groqFailed) {
      return this.togetherLlmService
        .create()
        .bindTools(tools) as unknown as BaseChatModel;
    }

    const primary = this.groqLlmService.create();
    const fallback = this.togetherLlmService.create();

    const boundPrimary = primary.bindTools(tools).withListeners({
      onError: (run: any) => {
        this.logger.warn(
          `Primary ToolBound (Groq) failed: ${run.error}. Switching to persistent fallback.`,
        );
        this.groqFailed = true;
      },
    });
    const boundFallback = fallback.bindTools(tools).withListeners({
      onStart: () => this.logger.log('Fallback ToolBound (Together) triggered!'),
      onError: (run: any) =>
        this.logger.error(`Fallback ToolBound (Together) failed: ${run.error}`),
    });

    return boundPrimary.withFallbacks({
      fallbacks: [boundFallback],
    }) as unknown as BaseChatModel;
  }
}
