import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeInferenceEmbeddings } from "./pinecone-embeddings";
import prisma from "../db/prisma";

import { getSecret } from "../../utils/secrets";

const apiKey = getSecret("PINECONE_API_KEY");
const indexName = getSecret("PINECONE_INDEX");

const pc = new Pinecone({ apiKey });
const embeddings = new PineconeInferenceEmbeddings();

export type SyncType = 'project' | 'task' | 'snippet' | 'doc';

export async function syncToVectorStore(
    type: SyncType,
    id: string,
    action: 'upsert' | 'delete'
) {
    const index = pc.index({ name: indexName });

    if (action === 'delete') {
        try {
            await (index as any).deleteOne({ id });
            console.log(`[VectorSync] Deleted ${type}: ${id}`);
        } catch (e: any) {
            console.error(`[VectorSync] Failed to delete ${type}: ${id}`, e.message || e);
        }
        return;
    }

    // Fetch the latest data from the database
    let data: any;
    try {
        switch (type) {
            case 'project':
                data = await prisma.project.findUnique({ where: { id } });
                break;
            case 'task':
                data = await prisma.task.findUnique({
                    where: { id },
                    include: { project: true }
                });
                break;
            case 'snippet':
                data = await prisma.snippet.findUnique({
                    where: { id },
                    include: { project: true }
                });
                break;
            case 'doc':
                data = await prisma.doc.findUnique({
                    where: { id },
                    include: { project: true }
                });
                break;
        }
    } catch (err) {
        console.error(`[VectorSync] DB fetch failed for ${type}: ${id}`, err);
        return;
    }

    if (!data) {
        console.warn(`[VectorSync] ${type} not found in DB: ${id}. Skipping upsert.`);
        return;
    }

    // Prepare text and metadata for embedding
    let text = "";
    let metadata: any = {
        type,
        projectId: data.projectId || data.id,
        projectTitle: data.project?.title || data.title || "Unknown",
    };

    switch (type) {
        case 'project':
            text = `Project Title: ${data.title}\nDescription: ${data.description || "No description"}`;
            break;
        case 'task':
            text = `Task Title: ${data.title}\nStatus: ${data.status}\nDescription: ${data.description || "No description"}`;
            break;
        case 'snippet':
            text = `Snippet Title: ${data.title}\nLanguage: ${data.language}\nContent:\n${data.content}`;
            metadata.language = data.language;
            break;
        case 'doc':
            const contentStr = typeof data.content === 'string' ? data.content : JSON.stringify(data.content || {});
            text = `Doc Label: ${data.label}\nContent:\n${contentStr}`;
            break;
    }

    try {
        const values = await embeddings.embedDocuments([text]);

        await index.upsert({
            records: [{
                id: data.id,
                values: values[0],
                metadata: {
                    ...metadata,
                    text // Store full text for RAG retrieval
                }
            }]
        });

        console.log(`[VectorSync] Upserted ${type}: ${data.id} (${data.title || data.label})`);
    } catch (e: any) {
        console.error(`[VectorSync] Failed to sync ${type}: ${data.id}`, e.message || e);
    }
}
