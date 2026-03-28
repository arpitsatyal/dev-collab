import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableLike } from '@langchain/core/runnables';
import { StructuredTool } from '@langchain/core/tools';
import { ZodTypeAny } from 'zod';

export abstract class LlmGateway {
  abstract getReasoningLLM(): Promise<BaseChatModel>;
  abstract getSpeedyLLM(): Promise<BaseChatModel>;
  abstract getReasoningStructuredLLM(
    schema: ZodTypeAny | Record<string, any>,
    name: string,
  ): Promise<RunnableLike<any, any>>;
  abstract getReasoningToolBoundLLM(
    tools: StructuredTool[],
  ): Promise<BaseChatModel>;
}
