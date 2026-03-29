export interface IChatContext {
    chatId: string;
    question: string;
    filters?: Record<string, any>;
    inWorkspace: boolean;
    workspaceId?: string;
}

export interface IChatResponse {
    answer: string;
    context: string;
    validated: {
        isValid: boolean;
        warning: string | null;
    };
}

export interface IintentResult {
    intent: string;
    scope: 'APP_SPECIFIC' | 'OUT_OF_SCOPE';
}