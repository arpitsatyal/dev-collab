import { LlmModel } from 'src/modules/ai/llms/interfaces/llm.types';

export interface SearchMetadata {
  type?: string;
  workspaceId?: string;
  workspaceTitle?: string;
  [key: string]: unknown;
}

export interface SearchDocument {
  pageContent: string;
  metadata?: SearchMetadata;
}

export interface SearchHit {
  doc: SearchDocument;
  score: number;
}

export abstract class RetrievalPort {
  abstract generateQueryVariations(
    query: string,
    llm: LlmModel,
  ): Promise<string[]>;
  abstract performHybridSearch(
    queries: string[],
    originalQuery: string,
    filters?: Record<string, any>,
  ): Promise<SearchHit[]>;
}
