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