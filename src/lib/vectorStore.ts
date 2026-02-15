import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeInferenceEmbeddings } from "./pinecone-embeddings";
import { getSecret } from "../utils/secrets";

export async function getVectorStore() {
    const pineconeApiKey = getSecret("PINECONE_API_KEY") || process.env.PINECONE_API_KEY!;
    const index = getSecret("PINECONE_INDEX") || process.env.PINECONE_INDEX!

    console.log('pineconeApiKey', pineconeApiKey)
    console.log('pineconeIndex', index)

    const pinecone = new Pinecone({
        apiKey: pineconeApiKey,
    });

    const pineconeIndex = pinecone.index(
        index
    );

    // Use Pinecone Inference API for embeddings compatibility
    const embeddings = new PineconeInferenceEmbeddings();

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
    });

    return vectorStore;
}
