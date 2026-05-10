import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable } from '@langchain/core/runnables';
import { LlmModel, StructuredLlm, ToolBoundLlm, LlmStructuredSchema } from 'src/modules/ai/orchestrator/llm/llm.types';

/**
 * Describes the configuration for a LangChain model, including optional fallbacks and listeners.
 */
export interface LangChainModelConfig {
  primary: BaseChatModel;
  secondary?: BaseChatModel;
  primaryListeners?: any;
  secondaryListeners?: any;
}

export class LangChainLlmWrapper implements LlmModel {
  constructor(private readonly config: LangChainModelConfig) { }

  /**
   * Internal helper to build the LangChain runnable chain in the correct order:
   * 1. Bind Tools / Structured Output (Base Model level)
   * 2. Add Listeners (Runnable level)
   * 3. Apply Fallbacks (Chain level)
   */
  private getRunnable(tools?: unknown[], schema?: LlmStructuredSchema): Runnable {
    const decorate = (model: BaseChatModel, listeners?: any) => {
      let m: any = model;

      // Apply tool/structured binding first (must be on the chat model)
      if (tools) {
        if (typeof m.bindTools !== 'function') {
          throw new Error(`Model ${m.constructor.name} does not support tool binding.`);
        }
        m = m.bindTools(tools);
      } else if (schema) {
        if (typeof m.withStructuredOutput !== 'function') {
          throw new Error(`Model ${m.constructor.name} does not support structured output.`);
        }
        m = m.withStructuredOutput(schema);
      }

      // Apply listeners next (returns a RunnableBinding)
      if (listeners) {
        m = m.withListeners(listeners);
      }

      return m as Runnable;
    };

    const primaryRunnable = decorate(this.config.primary, this.config.primaryListeners);

    if (this.config.secondary) {
      const secondaryRunnable = decorate(this.config.secondary, this.config.secondaryListeners);
      return primaryRunnable.withFallbacks({
        fallbacks: [secondaryRunnable],
      });
    }

    return primaryRunnable;
  }

  async invoke(input: unknown): Promise<unknown> {
    return this.getRunnable().invoke(input as any);
  }

  async generateText(input: unknown): Promise<string> {
    return this.getRunnable().pipe(new StringOutputParser()).invoke(input as any);
  }

  bindTools(tools: unknown[]): ToolBoundLlm {
    // Return the runnable as an opaque ToolBoundLlm
    return this.getRunnable(tools) as unknown as ToolBoundLlm;
  }

  withStructuredOutput(schema: LlmStructuredSchema): StructuredLlm {
    // Return the runnable as an opaque StructuredLlm
    return this.getRunnable(undefined, schema) as unknown as StructuredLlm;
  }

  /**
   * @deprecated Used only for internal adapter logic. 
   * Provides the primary raw model.
   */
  getRawModel(): BaseChatModel {
    return this.config.primary;
  }
}
