import { AiMessageRole } from '../enums/ai.enums';
import { IntentSchema } from '../schemas';
import * as z from 'zod';

export interface IAiMessage {
  role: AiMessageRole;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export type LlmMessage = IAiMessage;
export type IintentResult = z.infer<typeof IntentSchema>;
export type ChatScope = 'APP_SPECIFIC' | 'DOMAIN_KNOWLEDGE' | 'OUT_OF_SCOPE';
export type IntentClassifierLlm = {
  invoke(input: unknown): Promise<IintentResult>;
};

export interface IAiResult {
  answer: string;
  sources?: string[];
  context?: string;
  calledTools?: string[];
  interrupted?: boolean;
}

export interface GetAiResponseRequest {
  chatId: string;
  question: string;
  filters?: {
    workspaceId?: string;
  };
}

export interface AnalyzeWorkItemRequest {
  workItemId: string;
}

export interface SuggestSnippetFilenameRequest {
  code: string;
  language?: string;
  workspaceId: string;
}

export interface SuggestWorkItemsRequest {
  workspaceId: string;
}

export interface GetAIResponseWithToolsParams {
  chatId: string;
  question: string;
  history: string;
  workspaceId: string;
}

export interface GetAIResponseWithSearchParams {
  chatId: string;
  question: string;
  history: string;
  filters?: {
    workspaceId?: string;
  };
}
