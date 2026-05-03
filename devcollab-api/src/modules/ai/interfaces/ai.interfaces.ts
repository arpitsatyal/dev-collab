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
