import fs from "fs";
import path from "path";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { getSecret } from "../utils/secrets";

export async function createVectorStore() {
  const filePath: string = path.resolve(process.cwd(), "ai", "features.md");
  const rawText = fs.readFileSync(filePath, "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const docs = await splitter.createDocuments([rawText]);

  const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    apiKey: getSecret("HUGGINGFACE_API_KEY"),
    provider: "hf-inference",
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
}
