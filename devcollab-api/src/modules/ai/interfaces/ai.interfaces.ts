import { ChatScope, IintentResult } from '../types/ai.types';

export interface IChatContext {
  chatId: string;
  question: string;
  history: string;
  workspaceId?: string;
  inWorkspace: boolean;
}

export interface IChatResponse {
  answer: string;
  sources?: string[];
  context?: string;
  calledTools?: string[];
}

export interface IAiResult {
  answer: string;
  sources?: string[];
  context?: string;
  calledTools?: string[];
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

export interface HandleConversationalParams {
  context: IChatContext;
  scope: ChatScope;
}

export interface HandleWorkspaceQueryParams {
  context: IChatContext;
}

export interface GetAIResponseWithToolsParams {
  chatId: string;
  question: string;
  history: string;
  workspaceId: string;
}

export interface GetAIResponseWithSearchParams {
  question: string;
  history: string;
  filters?: {
    workspaceId?: string;
  };
}
