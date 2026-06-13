import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DrizzleService } from '../common/drizzle/drizzle.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

async function bootstrap() {
  console.log('🚀 Starting full MeiliSearch synchronization...');

  // Boot up NestJS Application Context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const drizzle = app.get(DrizzleService);
    const config = app.get(ConfigService);

    const meiliUrl = config.get<string>('MEILISEARCH_SYNC_URL');
    if (!meiliUrl) {
      console.error(
        '❌ MEILISEARCH_SYNC_URL is not defined in the environment.',
      );
      process.exit(1);
    }

    console.log('📦 Fetching all data from database...');

    const [workspaces, workItems, snippets, docs] = await Promise.all([
      drizzle.db.query.workspaces.findMany(),
      drizzle.db.query.workItems.findMany({ with: { workspace: true } }),
      drizzle.db.query.snippets.findMany({ with: { workspace: true } }),
      drizzle.db.query.docs.findMany({ with: { workspace: true } }),
    ]);

    console.log(`✅ Found:
    - ${workspaces.length} Workspaces
    - ${workItems.length} Work Items
    - ${snippets.length} Snippets
    - ${docs.length} Docs
    `);

    const syncToMeili = async (type: string, data: any) => {
      try {
        await axios.post(meiliUrl, { doc: data, type });
        return true;
      } catch (err: any) {
        const errorMsg = err.response?.data?.msg || err.message;
        console.error(`  ❌ Error syncing ${type} [${data.id}]: ${errorMsg}`);
        return false;
      }
    };

    const allItems: { doc: any; type: string }[] = [
      ...workspaces.map((item) => ({ doc: item, type: 'workspace' })),
      ...workItems.map((item) => ({ doc: item, type: 'workItem' })),
      ...snippets.map((item) => ({ doc: item, type: 'snippet' })),
      ...docs.map((item) => ({ doc: item, type: 'doc' })),
    ];

    const CONCURRENCY = 5;
    let totalSynced = 0;

    console.log(
      `🔄 Syncing ${allItems.length} records with concurrency ${CONCURRENCY}...`,
    );

    for (let i = 0; i < allItems.length; i += CONCURRENCY) {
      const chunk = allItems.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map((item) => syncToMeili(item.type, item.doc)),
      );
      totalSynced += results.filter(Boolean).length;
      console.log(
        `  🕒 Progress: ${Math.min(i + CONCURRENCY, allItems.length)}/${allItems.length} records processed...`,
      );
    }

    console.log('\n✨ Synchronization Complete!');
    console.log(`📊 Total records synced to MeiliSearch: ${totalSynced}`);
  } catch (error) {
    console.error('💥 Synchronization failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error during sync bootstrap:', err);
  process.exit(1);
});
