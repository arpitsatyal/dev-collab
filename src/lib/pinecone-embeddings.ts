import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
import { Pinecone } from "@pinecone-database/pinecone";
import { getSecret } from "../utils/secrets";

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
        this.apiKey = params?.apiKey || getSecret("PINECONE_API_KEY") || process.env.PINECONE_API_KEY!;
        this.model = params?.model || "multilingual-e5-large";
        this.client = new Pinecone({ apiKey: this.apiKey });
    }

    async embedDocuments(documents: string[]): Promise<number[][]> {
        const inference = this.client.inference as any;
        const response = await inference.embed({
            model: this.model,
            inputs: documents,
            parameters: { inputType: 'passage', truncate: 'END' }
        });
        // Cast to any because the SDK types might be mismatching or 'values' is optional
        return response.data.map((d: any) => d.values as number[]);
    }

    async embedQuery(document: string): Promise<number[]> {
        const inference = this.client.inference;
        const response = await inference.embed({
            model: this.model,
            inputs: [document],
            parameters: { inputType: 'query', truncate: 'END' }
        });
        return (response.data[0] as any).values as number[];
    }
}
