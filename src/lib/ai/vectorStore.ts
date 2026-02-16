import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeInferenceEmbeddings } from "./pinecone-embeddings";
import { getSecret } from "../../utils/secrets";

export async function getVectorStore() {
    const pineconeApiKey = getSecret("PINECONE_API_KEY");
    const index = getSecret("PINECONE_INDEX");

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
