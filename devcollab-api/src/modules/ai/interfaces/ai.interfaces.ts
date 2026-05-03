import { ChatScope } from './ai.types';

export interface IChatContext {
  chatId: string;
  question: string;
  history: string;
  workspaceId?: string;
  inWorkspace: boolean;
  filters?: Record<string, unknown>;
}

export interface IChatResponse {
  answer: string;
  sources?: string[];
  context?: string;
  calledTools?: string[];
  validated?: {
    isValid: boolean;
    warning: string | null;
  };
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
  chatId: string;
  question: string;
  history: string;
  filters?: {
    workspaceId?: string;
  };
}
