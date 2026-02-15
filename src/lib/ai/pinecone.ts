import { Pinecone } from "@pinecone-database/pinecone";
import { getSecret } from "../../utils/secrets";

let pineconeClient: Pinecone | null = null;

export function getPineconeClient() {
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: getSecret("PINECONE_API_KEY") || process.env.PINECONE_API_KEY!,
        });
    }
    return pineconeClient;
}

// Helper to get the index name safely
export function getPineconeIndexName() {
    return getSecret("PINECONE_INDEX") || process.env.PINECONE_INDEX || "dev-collab";
}
