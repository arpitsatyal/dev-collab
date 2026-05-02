import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { Pinecone } from '@pinecone-database/pinecone';

export interface PineconeInferenceEmbeddingsParams extends EmbeddingsParams {
  apiKey?: string;
  model?: string;
}

export class PineconeInferenceEmbeddings extends Embeddings {
  apiKey: string;
  model: string;
  client: Pinecone;

  constructor(params?: PineconeInferenceEmbeddingsParams) {
    super(params ?? {});
    this.apiKey = params?.apiKey || '';
    if (!this.apiKey) throw new Error('Pinecone API key is required');
    this.model = params?.model || 'multilingual-e5-large';
    this.client = new Pinecone({ apiKey: this.apiKey });
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const inference = this.client.inference as any;
    const response = await inference.embed({
      model: this.model,
      inputs: documents,
      parameters: { inputType: 'passage', truncate: 'END' },
    });
    return response.data.map((d: any) => d.values as number[]);
  }

  async embedQuery(document: string): Promise<number[]> {
    const inference = this.client.inference as any;
    const response = await inference.embed({
      model: this.model,
      inputs: [document],
      parameters: { inputType: 'query', truncate: 'END' },
    });
    return response.data[0].values as number[];
  }
}
