import { ZodTypeAny } from 'zod';
import { IAiTool } from 'src/modules/ai/tools/ports/tools.port';
import { LlmProvider, LlmTaskType } from './llm.enums';

/**
 * Represents a standard Chat LLM model with tool and structured output capabilities.
 * Agnostic of the underlying library (e.g., LangChain).
 */
export interface LlmModel {
  invoke(input: unknown): Promise<unknown>;
  generateText(input: unknown): Promise<string>;
  bindTools(tools: unknown[]): ToolBoundLlm;
  withStructuredOutput(schema: LlmStructuredSchema): StructuredLlm;
}

/**
 * Represents an LLM model that produces structured output.
 */
export interface StructuredLlm {
  invoke(input: unknown): Promise<unknown>;
}

/**
 * Represents the schema used for structured output.
 */
export type LlmStructuredSchema = ZodTypeAny | Record<string, unknown>;

/**
 * Represents an LLM model that has been bound to tools.
 */
export interface ToolBoundLlm {
  invoke(input: unknown): Promise<unknown>;
}

/**
 * Port for interacting with a specific LLM provider.
 */
export abstract class LlmProviderPort {
  abstract create(type?: LlmTaskType): LlmModel;
}

/**
 * Context for managing multiple providers with fallback logic.
 */
export interface ProviderContext {
  primary: LlmProviderPort;
  secondary: LlmProviderPort;
  primaryType: LlmProvider;
  secondaryType: LlmProvider;
  primaryFailed: boolean;
  secondaryFailed: boolean;
  markPrimaryFailed: () => void;
  markSecondaryFailed: () => void;
}

/**
 * Port for the application's LLM gateway.
 */
export abstract class LlmGateway {
  abstract getReasoningLLM(): Promise<LlmModel>;
  abstract getSpeedyLLM(): Promise<LlmModel>;
  abstract getReasoningStructuredLLM(
    schema: LlmStructuredSchema,
    name: string,
  ): Promise<StructuredLlm>;
  abstract getReasoningToolBoundLLM(
    tools: IAiTool[],
  ): Promise<ToolBoundLlm>;
}
