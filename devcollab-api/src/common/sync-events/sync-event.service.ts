import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@upstash/qstash';
import { SyncEventPort, EventType } from './ports/sync-event.port';
import { DrizzleService } from '../drizzle/drizzle.service';
import { ConfigService } from '@nestjs/config';
import { workspaces } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { SearchEnginePort } from '../search-engine/ports/search-engine.port';

@Injectable()
export class SyncEventService implements SyncEventPort {
  private readonly logger = new Logger(SyncEventService.name);
  private readonly client: Client;
  private readonly appUrl: string;

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly configService: ConfigService,
    private readonly searchEngine: SearchEnginePort,
  ) {
    this.client = new Client({
      token: this.configService.getOrThrow<string>('QSTASH_TOKEN'),
    });
    this.appUrl = this.configService.getOrThrow<string>('APP_URL');
  }

  async publishSyncEvent(
    type: EventType,
    data: any,
    action: 'upsert' | 'delete' = 'upsert',
  ) {
    const webhookUrl = `${this.appUrl}/api/webhooks/vector-sync`;

    // 1. Pinecone — queued via QStash
    let messageId: string | undefined;
    try {
      const result = await this.client.publishJSON({
        queue: 'vector-sync-queue',
        url: webhookUrl,
        body: { type, data: { id: data.id }, action },
        contentBasedDeduplication: true,
        retries: 3,
      });
      this.logger.log(`[QStash] Published messageId: ${result.messageId}`);
      messageId = result.messageId;
    } catch (err) {
      this.logger.warn(
        `[QStash] Failed to publish sync event for ${type}: ${data.id} -> ${err?.message || err}`,
      );
    }

    // 2. MeiliSearch — Direct Sync
    if (action === 'upsert') {
      void this.syncMeiliSearch(type, data);
    }

    return messageId;
  }

  private async syncMeiliSearch(type: EventType, data: any) {
    try {
      const syncDoc = { ...data };
      if (data.workspaceId) {
        const workspace = await this.drizzle.db.query.workspaces.findFirst({
          where: eq(workspaces.id, data.workspaceId),
        });
        if (workspace) syncDoc.workspace = workspace;
      }

      await this.searchEngine.syncDocument(syncDoc, type);
    } catch (err: any) {
      this.logger.warn(
        `[MeiliSearch] Failed to sync ${type}: ${data.id} -> ${err?.message || err}`,
      );
    }
  }
}
