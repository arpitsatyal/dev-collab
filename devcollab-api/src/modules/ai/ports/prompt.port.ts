import { BaseMessage } from '@langchain/core/messages';

export abstract class PromptPort {
  abstract constructPrompt(
    context: string,
    history: string,
    question: string,
  ): Promise<string> | string;
  abstract buildChatMessages(history: string, question: string, workspaceId?: string): BaseMessage[];
  abstract buildIntentClassificationPrompt(question: string, inWorkspace?: boolean): BaseMessage[];
  abstract buildConversationalMessages(history: string, question: string, isOutOfScope?: boolean): BaseMessage[];
}
