export interface IChatContext {
  chatId: string;
  question: string;
  history: string;
  filters?: Record<string, any>;
  inWorkspace: boolean;
  workspaceId?: string;
}

export interface IAiResult {
  answer: string;
  context?: string;
  sources?: string[];
  calledTools?: string[];
}

export interface IChatResponse extends IAiResult {
  validated: {
    isValid: boolean;
    warning: string | null;
  };
}

export type ChatScope = 'APP_SPECIFIC' | 'DOMAIN_KNOWLEDGE' | 'OUT_OF_SCOPE';

export interface IintentResult {
  intent: string;
  scope: ChatScope;
}

export interface AiFilters {
  workspaceId?: string;
}
