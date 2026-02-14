import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeInferenceEmbeddings } from "./pinecone-embeddings";
import { getSecret } from "../utils/secrets";

export async function getVectorStore() {
    const pinecone = new Pinecone({
        apiKey: getSecret("PINECONE_API_KEY") || process.env.PINECONE_API_KEY!,
    });

    const pineconeIndex = pinecone.index(
        getSecret("PINECONE_INDEX") || process.env.PINECONE_INDEX!
    );

    // Use Pinecone Inference API for embeddings compatibility
    const embeddings = new PineconeInferenceEmbeddings();

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
    });

    return vectorStore;
}
