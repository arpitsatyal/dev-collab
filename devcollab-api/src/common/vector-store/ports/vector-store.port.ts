export interface IVectorDocument {
  pageContent: string;
  metadata: Record<string, any>;
}

export abstract class VectorStorePort {
  abstract syncToVectorStore(
    type: 'workspace' | 'workItem' | 'snippet' | 'doc',
    id: string,
    action: 'upsert' | 'delete',
  ): Promise<void>;

  abstract search(
    query: string,
    limit: number,
    filters?: Record<string, any>,
  ): Promise<[IVectorDocument, number][]>;
}
