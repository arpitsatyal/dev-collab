export abstract class SearchEnginePort {
  /**
   * Performs a keyword search across indexed documents.
   */
  abstract search(query: string): Promise<any[]>;

  /**
   * Syncs a single document to the search index.
   */
  abstract syncDocument(doc: any, type: string): Promise<void>;

  /**
   * Syncs a batch of documents to the search index.
   */
  abstract syncBatch(items: { doc: any; type: string }[]): Promise<void>;
}
