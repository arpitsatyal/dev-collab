import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Runnable, RunnableLike } from '@langchain/core/runnables';
import { ZodTypeAny } from 'zod';

/**
 * Interface for any LLM-related object that supports LangChain listeners and fallbacks.
 */
export interface LlmRunnable extends Runnable<any, any> {}

/**
 * Represents a standard Chat LLM model with tool and structured output capabilities.
 * This is typically the raw model before any bindings.
 */
export type LlmModel = BaseChatModel & LlmRunnable & {
  bindTools: NonNullable<BaseChatModel['bindTools']>;
  withStructuredOutput: NonNullable<BaseChatModel['withStructuredOutput']>;
};

/**
 * Represents an LLM model that produces structured output.
 */
export type StructuredLlm = RunnableLike<any, any> & LlmRunnable;

/**
 * Represents the schema used for structured output.
 */
export type LlmStructuredSchema = ZodTypeAny | Record<string, any>;

/**
 * Represents an LLM model that has been bound to tools.
 */
export type ToolBoundLlm = Runnable<any, any> & LlmRunnable;
