export interface SearchMetadata {
  type: string;
  [key: string]: any;
}

export interface SearchHit {
  id: string;
  title: string;
  content?: string;
  metadata: SearchMetadata;
  score?: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

export interface SearchResult {
  hits: SearchHit[];
  total?: number;
  query: string;
}
