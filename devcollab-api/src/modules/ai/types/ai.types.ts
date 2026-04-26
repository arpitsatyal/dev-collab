import { IChatContext } from '../interfaces';

export interface SuggestSnippetFilenameRequest {
  workspaceId: string;
  code: string;
  language?: string;
}

export interface AiFilters {
  workspaceId?: string;
}

export interface GetAiResponseRequest {
  chatId: string;
  question: string;
  filters?: AiFilters;
}

export interface AnalyzeWorkItemRequest {
  workItemId: string;
}

export interface SuggestWorkItemsRequest {
  workspaceId: string;
}

/**
 * Internal interfaces for ChatEngineService
 */

export interface GetAIResponseWithToolsRequest {
  chatId: string;
  question: string;
  history: string;
  workspaceId: string;
}

export interface GetAIResponseWithSearchRequest {
  chatId: string;
  question: string;
  history: string;
  filters?: Record<string, any>;
}

export interface HandleConversationalRequest {
  context: IChatContext;
  scope: string;
}

export interface HandleWorkspaceQueryRequest {
  context: IChatContext;
}
