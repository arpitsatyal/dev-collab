import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

async function checkIndex() {
    console.log("Checking Pinecone index...");
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const indexName = process.env.PINECONE_INDEX!;

    try {
        const description = await pc.describeIndex(indexName);
        console.log("Index Description:", JSON.stringify(description, null, 2));
    } catch (e) {
        console.error("Error describing index:", e);
    }
}

checkIndex();
