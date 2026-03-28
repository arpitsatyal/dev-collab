import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DrizzleService } from '../common/drizzle/drizzle.service';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';

const MODEL = 'multilingual-e5-large';
const DIMENSIONS = 1024;
const BATCH_SIZE = 50;

async function bootstrap() {
  console.log('Starting data ingestion with Pinecone Inference API (NestJS CLI)...');

  // Boot up NestJS Application Context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const drizzle = app.get(DrizzleService);
  const config = app.get(ConfigService);

  const apiKey = config.getOrThrow<string>('PINECONE_API_KEY');
  const indexName = config.getOrThrow<string>('PINECONE_INDEX');

  const pc = new Pinecone({ apiKey });

  // Step 1: Force Recreate Index
  console.log(`Checking index '${indexName}'...`);
  try {
    const indexList = await pc.listIndexes();
    const exists = indexList.indexes?.some((idx) => idx.name === indexName);

    if (exists) {
      console.log(`🗑️ Deleting existing index '${indexName}' for clean ingestion...`);
      await pc.deleteIndex(indexName);
      console.log(`⏳ Waiting for deletion to propagate (10s)...`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  } catch (e) {
    console.warn('Error checking/deleting index, proceeding to creation attempt:', e);
  }

  console.log(`🆕 Creating index '${indexName}' with dimensions ${DIMENSIONS}...`);
  try {
    await pc.createIndex({
      name: indexName,
      dimension: DIMENSIONS,
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    });
    console.log(`⏳ Waiting for index initialization for 30s...`);
    await new Promise((r) => setTimeout(r, 30000));
  } catch (e: any) {
    if (e?.message?.includes('already exists')) {
      console.log('Index creation race condition - index already exists. Proceeding.');
    } else {
      throw e;
    }
  }

  const index = pc.index(indexName);

  // Step 2: Fetch Data (Workspaces, Work Items, Snippets, Docs)
  console.log('Fetching data from database via Drizzle...');
  
  const [workspaces, workItems, snippets, docs] = await Promise.all([
    drizzle.db.query.workspaces.findMany({ with: { workItems: true, snippets: true, docs: true } }),
    drizzle.db.query.workItems.findMany({ with: { workspace: true } }),
    drizzle.db.query.snippets.findMany({ with: { workspace: true } }),
    drizzle.db.query.docs.findMany({ with: { workspace: true } }),
  ]);

  console.log(
    `Found: ${workspaces.length} Workspaces, ${workItems.length} Work Items, ${snippets.length} Snippets, ${docs.length} Docs.`,
  );

  // Step 3: Prepare Records
  const records: { id: string; text: string; metadata: any }[] = [];

  // --- GLOBAL SUMMARY RECORD ---
  const todoItems = workItems.filter((t) => t.status === 'TODO').length;
  const inProgressItems = workItems.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneItems = workItems.filter((t) => t.status === 'DONE').length;

  const globalSummary = `Global Platform Overview & Statistics:
- Total Workspaces: ${workspaces.length}
- Total Work Items: ${workItems.length} (TODO: ${todoItems}, In Progress: ${inProgressItems}, Done: ${doneItems})
- Total Documentation Files: ${docs.length}
- Total Code Snippets: ${snippets.length}

Use this information when asked about "how many", "total count", "platform summary", or "general stats" regarding the Dev-Collab app.`;

  records.push({
    id: 'global-platform-summary',
    text: globalSummary,
    metadata: {
      type: 'summary',
      workspaceId: 'global',
      workspaceTitle: 'Dev-Collab Platform',
      original_text: 'Global Platform Statistics and Overview',
    },
  });

  // --- APP FEATURE RECORDS ---
  const appFeatures = [
    {
      id: "feature-dashboard",
      title: "Dashboard",
      description: "The main landing page after login. It provides a grid overview of all your workspaces, including their titles, descriptions, and quick access to work items, snippets, and documentation."
    },
    {
      id: "feature-playground",
      title: "Collaborative Playground",
      description: "A collaborative code editor where users can write code in real-time. It's accessible via the /playground route. Users can share the specific room link (e.g., /playground?roomId=xyz) with others to code together live."
    },
    {
      id: "feature-search",
      title: "Global Search",
      description: "A comprehensive search interface that allows users to find workspaces, work items, snippets, and documents across the entire platform. Uses semantic search to find relevant results based on meaning, not just keywords."
    },
    {
      id: "feature-ai-chat",
      title: "AI Chat Assistant",
      description: "A persistent sidebar assistant available throughout the app (except in specific full-screen views). It uses RAG (Retrieval-Augmented Generation) to answer questions about your workspaces and platform features."
    },
    {
      id: "feature-project-management",
      title: "Workspace Management",
      description: "The core functionality for organizing work. Each workspace can contain its own set of work items, code snippets, and structured documentation."
    }
  ];

  appFeatures.forEach((feature) => {
    records.push({
      id: feature.id,
      text: `App Feature: ${feature.title}\nDescription: ${feature.description}`,
      metadata: {
        type: 'app_feature',
        workspaceId: 'platform',
        workspaceTitle: 'Dev-Collab Features',
        original_text: `UI Feature: ${feature.title}`,
      },
    });
  });

  workspaces.forEach((workspace) => {
    records.push({
      id: workspace.id,
      text: `Workspace Title: ${workspace.title}\nDescription: ${workspace.description || 'No description'}`,
      metadata: {
        type: 'workspace',
        workspaceId: workspace.id,
        workspaceTitle: workspace.title,
        original_text: `Workspace: ${workspace.title} - ${workspace.description?.substring(0, 100)}`,
      },
    });
  });

  workItems.forEach((item) => {
    records.push({
      id: item.id,
      text: `Work Item Title: ${item.title}\nStatus: ${item.status}\nDescription: ${item.description || 'No description'}`,
      metadata: {
        type: 'workItem',
        workspaceId: item.workspaceId,
        workspaceTitle: item.workspace.title,
        original_text: `Work Item: ${item.title} - ${item.description?.substring(0, 100)}`,
      },
    });
  });

  snippets.forEach((snippet) => {
    records.push({
      id: snippet.id,
      text: `Snippet Title: ${snippet.title}\nLanguage: ${snippet.language}\nContent:\n${snippet.content}`,
      metadata: {
        type: 'snippet',
        workspaceId: snippet.workspaceId,
        workspaceTitle: snippet.workspace.title,
        language: snippet.language,
        original_text: `Snippet: ${snippet.title} (${snippet.language})`,
      },
    });
  });

  docs.forEach((doc) => {
    let contentStr = '';
    try {
      contentStr = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content);
    } catch (e) {
      contentStr = 'Error parsing content';
    }

    records.push({
      id: doc.id,
      text: `Doc Label: ${doc.label}\nContent:\n${contentStr}`,
      metadata: {
        type: 'doc',
        workspaceId: doc.workspaceId,
        workspaceTitle: doc.workspace.title,
        original_text: `Doc: ${doc.label}`,
      },
    });
  });

  console.log(`Total records to ingest: ${records.length}`);

  if (records.length === 0) {
    console.log('No data to ingest.');
    await app.close();
    return;
  }

  // Step 4: Generate Embeddings & Upsert in Batches
  let successCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((r) => r.text);

    try {
      const inference = pc.inference as any;
      const embeddings = await inference.embed({
        model: MODEL,
        inputs: inputs,
        parameters: { inputType: 'passage', truncate: 'END' },
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
              text: record.text,
            },
          });
        }
      });

      if (vectors.length === 0) {
        console.warn(`No valid vectors resulted from batch starting at ${i}`);
        continue;
      }

      await index.upsert({ records: vectors });

      successCount += vectors.length;
      console.log(`✓ Processed batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(records.length / BATCH_SIZE)} (${successCount}/${records.length})`);
    } catch (e) {
      console.error(`✗ Failed to process batch starting at index ${i}:`, e);
    }
  }

  console.log('\n=== Ingestion Complete ===');
  console.log(`Total documents indexed: ${successCount}`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
