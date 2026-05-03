import type { ChatScope, LlmMessage } from 'src/modules/ai/interfaces/ai.types';

export abstract class PromptPort {
  abstract constructPrompt(
    context: string,
    history: string,
    question: string,
  ): Promise<string> | string;
  abstract buildChatMessages(
    history: string,
    question: string,
    workspaceId?: string,
  ): LlmMessage[];
  abstract buildIntentClassificationPrompt(
    question: string,
    history: string,
    inWorkspace?: boolean,
  ): LlmMessage[];
  abstract buildConversationalMessages(
    history: string,
    question: string,
    scope?: ChatScope,
  ): LlmMessage[];
}
