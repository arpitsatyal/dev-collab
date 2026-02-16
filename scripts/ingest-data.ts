import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pinecone } from "@pinecone-database/pinecone";

const prisma = new PrismaClient();
const MODEL = "multilingual-e5-large";
const DIMENSIONS = 1024;
const BATCH_SIZE = 50;

async function ingestData() {
    console.log("Starting data ingestion with Pinecone Inference API...");

    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX || "dev-collab";

    if (!apiKey) {
        throw new Error("PINECONE_API_KEY is not set");
    }

    const pc = new Pinecone({ apiKey });

    // Step 1: Force Recreate Index
    console.log(`Checking index '${indexName}'...`);

    // Check if index exists to decide whether to delete
    try {
        const indexList = await pc.listIndexes();
        const exists = indexList.indexes?.some(idx => idx.name === indexName);

        if (exists) {
            console.log(`🗑️ Deleting existing index '${indexName}' for clean ingestion...`);
            await pc.deleteIndex(indexName);
            console.log(`⏳ Waiting for deletion to propagate (10s)...`);
            await new Promise(r => setTimeout(r, 10000));
        }
    } catch (e) {
        console.warn("Error checking/deleting index, proceeding to creation attempt:", e);
    }

    // Create new index
    console.log(`🆕 Creating index '${indexName}' with dimensions ${DIMENSIONS}...`);
    try {
        await pc.createIndex({
            name: indexName,
            dimension: DIMENSIONS,
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });
        console.log(`⏳ Waiting for index initialization for 30s...`);
        await new Promise(r => setTimeout(r, 30000)); // Increased wait time for safety
    } catch (e: any) {
        if (e?.message?.includes('already exists')) {
            console.log("Index creation race condition - index already exists. Proceeding.");
        } else {
            throw e;
        }
    }

    const index = pc.index(indexName);

    // Step 2: Fetch Data (Tasks, Snippets, Docs)
    console.log("Fetching data from database...");
    const [projects, tasks, snippets, docs] = await Promise.all([
        prisma.project.findMany({ include: { tasks: true, snippets: true, docs: true } }),
        prisma.task.findMany({ include: { project: true } }),
        prisma.snippet.findMany({ include: { project: true } }),
        prisma.doc.findMany({ include: { project: true } })
    ]);

    console.log(`Found: ${projects.length} Projects, ${tasks.length} Tasks, ${snippets.length} Snippets, ${docs.length} Docs.`);

    // Step 3: Prepare Records
    const records: { id: string; text: string; metadata: any }[] = [];

    // --- GLOBAL SUMMARY RECORD ---
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;

    const globalSummary = `Global Platform Overview & Statistics:
- Total Projects: ${projects.length}
- Total Tasks: ${tasks.length} (TODO: ${todoTasks}, In Progress: ${inProgressTasks}, Done: ${doneTasks})
- Total Documentation Files: ${docs.length}
- Total Code Snippets: ${snippets.length}

Use this information when asked about "how many", "total count", "platform summary", or "general stats" regarding the Dev-Collab app.`;

    records.push({
        id: "global-platform-summary",
        text: globalSummary,
        metadata: {
            type: "summary",
            projectId: "global",
            projectTitle: "Dev-Collab Platform",
            original_text: "Global Platform Statistics and Overview"
        }
    });

    // --- APP FEATURE RECORDS ---
    const appFeatures = [
        {
            id: "feature-dashboard",
            title: "Dashboard",
            description: "The main landing page after login. It provides a grid overview of all your projects, including their titles, descriptions, and quick access to tasks, snippets, and documentation."
        },
        {
            id: "feature-playground",
            title: "Collaborative Playground",
            description: "A collaborative code editor where users can write code in real-time. It's accessible via the /playground route. Users can share the specific room link (e.g., /playground?roomId=xyz) with others to code together live."
        },
        {
            id: "feature-search",
            title: "Global Search",
            description: "A comprehensive search interface that allows users to find projects, tasks, snippets, and documents across the entire platform. Uses semantic search to find relevant results based on meaning, not just keywords."
        },
        {
            id: "feature-ai-chat",
            title: "AI Chat Assistant",
            description: "A persistent sidebar assistant available throughout the app (except in specific full-screen views). It uses RAG (Retrieval-Augmented Generation) to answer questions about your projects and platform features."
        },
        {
            id: "feature-code-editor",
            title: "Collaborative Code Editor",
            description: "A real-time, multi-user code editor powered by Monaco and Liveblocks. Supports syntax highlighting for multiple languages and allows team members to code together as if they were on the same machine."
        },
        {
            id: "feature-project-management",
            title: "Project Management",
            description: "The core functionality for organizing work. Each project can contain its own set of tasks, code snippets, and structured documentation."
        }
    ];

    appFeatures.forEach(feature => {
        records.push({
            id: feature.id,
            text: `App Feature: ${feature.title}\nDescription: ${feature.description}`,
            metadata: {
                type: "app_feature",
                projectId: "platform",
                projectTitle: "Dev-Collab Features",
                original_text: `UI Feature: ${feature.title}`
            }
        });
    });

    projects.forEach(project => {
        records.push({
            id: project.id,
            text: `Project Title: ${project.title}\nDescription: ${project.description || "No description"}`,
            metadata: {
                type: "project",
                projectId: project.id,
                projectTitle: project.title,
                original_text: `Project: ${project.title} - ${project.description?.substring(0, 100)}`
            }
        });
    });

    // Map Tasks
    tasks.forEach(task => {
        records.push({
            id: task.id,
            text: `Task Title: ${task.title}\nStatus: ${task.status}\nDescription: ${task.description || "No description"}`,
            metadata: {
                type: "task",
                projectId: task.projectId,
                projectTitle: task.project.title,
                original_text: `Task: ${task.title} - ${task.description?.substring(0, 100)}`
            }
        });
    });

    // Map Snippets
    snippets.forEach(snippet => {
        records.push({
            id: snippet.id,
            text: `Snippet Title: ${snippet.title}\nLanguage: ${snippet.language}\nContent:\n${snippet.content}`,
            metadata: {
                type: "snippet",
                projectId: snippet.projectId,
                projectTitle: snippet.project.title,
                language: snippet.language,
                original_text: `Snippet: ${snippet.title} (${snippet.language})`
            }
        });
    });

    // Map Docs
    docs.forEach(doc => {
        // Handle JSON content safely
        let contentStr = "";
        try {
            contentStr = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content);
        } catch (e) {
            contentStr = "Error parsing content";
        }

        records.push({
            id: doc.id,
            text: `Doc Label: ${doc.label}\nContent:\n${contentStr}`,
            metadata: {
                type: "doc",
                projectId: doc.projectId,
                projectTitle: doc.project.title,
                original_text: `Doc: ${doc.label}`
            }
        });
    });

    console.log(`Total records to ingest: ${records.length}`);

    if (records.length === 0) {
        console.log("No data to ingest.");
        return;
    }

    // Step 4: Generate Embeddings & Upsert in Batches
    let successCount = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const inputs = batch.map(r => r.text);

        try {
            const inference = pc.inference as any;
            const embeddings = await inference.embed({
                model: MODEL,
                inputs: inputs,
                parameters: { inputType: 'passage', truncate: 'END' }
            });

            if (!embeddings || !embeddings.data) {
                console.error(`Invalid embeddings response for batch starting at ${i}`);
                continue;
            }

            const vectors: any[] = [];
            batch.forEach((record, idx) => {
                const item = embeddings.data[idx];
                if (item && item.values) {
                    vectors.push({
                        id: record.id,
                        values: item.values,
                        metadata: {
                            ...record.metadata,
                            text: record.text // Store full text for RAG retrieval
                        }
                    });
                }
            });

            if (vectors.length === 0) {
                console.warn(`No valid vectors resulted from batch starting at ${i}`);
                continue;
            }

            // Correct upsert usage
            await index.upsert({ records: vectors });

            successCount += vectors.length;
            console.log(`✓ Processed batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(records.length / BATCH_SIZE)} (${successCount}/${records.length})`);

        } catch (e) {
            console.error(`✗ Failed to process batch starting at index ${i}:`, e);
        }
    }

    console.log("\n=== Ingestion Complete ===");
    console.log(`Total documents indexed: ${successCount}`);
}

ingestData()
    .catch(e => {
        console.error("Ingestion failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
