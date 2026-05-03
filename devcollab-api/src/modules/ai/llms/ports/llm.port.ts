import { StructuredTool } from '@langchain/core/tools';
import { LlmModel, StructuredLlm, ToolBoundLlm, LlmStructuredSchema } from '../interfaces/llm.interfaces';

export abstract class LlmGateway {
  abstract getReasoningLLM(): Promise<LlmModel>;
  abstract getSpeedyLLM(): Promise<LlmModel>;
  abstract getReasoningStructuredLLM(
    schema: LlmStructuredSchema,
    name: string,
  ): Promise<StructuredLlm>;
  abstract getReasoningToolBoundLLM(
    tools: StructuredTool[],
  ): Promise<ToolBoundLlm>;
}
