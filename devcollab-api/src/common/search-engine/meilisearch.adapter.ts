import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch, Index } from 'meilisearch';
import { SearchEnginePort } from './ports/search-engine.port';

import { SearchHit, SearchOptions } from './types/search.types';

@Injectable()
export class MeiliSearchAdapter implements SearchEnginePort, OnModuleInit {
  private readonly logger = new Logger(MeiliSearchAdapter.name);
  private client: Meilisearch;
  private index: Index;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('MEILISEARCH_HOST');
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');
    const indexName = this.configService.get<string>('MEILISEARCH_INDEX');

    if (!host) {
      this.logger.warn(
        'MEILISEARCH_HOST is not defined. Search engine features will be disabled.',
      );
      return;
    }

    this.client = new Meilisearch({ host, apiKey });

    if (!indexName) {
      this.logger.warn(
        'MEILISEARCH_INDEX is not defined. Search engine features will be disabled.',
      );
      return;
    }
    this.index = this.client.index(indexName);

    this.logger.log(`Initialized MeiliSearch adapter for index: ${indexName}`);
  }

  async search(query: string, options?: SearchOptions): Promise<SearchHit[]> {
    if (!this.index) return [];

    try {
      const result = await this.index.search(query, {
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
        attributesToHighlight: ['title'],
        cropLength: 20,
      });

      return result.hits.map((hit: any) => ({
        id: hit.id,
        title: hit.title || hit.label || 'Untitled',
        content: hit.content || hit.description,
        metadata: {
          type: hit.type,
          workspaceId: hit.workspaceId,
          ...hit,
        },
      }));
    } catch (error) {
      this.logger.error(`Search failed for query "${query}": ${error.message}`);
      throw error;
    }
  }

  async syncDocument(doc: any, type: string) {
    if (!this.index) return;

    try {
      const document = { ...doc, type };
      await this.index.addDocuments([document], { primaryKey: 'id' });
      this.logger.log(`[MeiliSearch] Synced ${type} [${doc.id}]`);
    } catch (error) {
      this.logger.error(
        `[MeiliSearch] Failed to sync ${type} [${doc.id}]: ${error.message}`,
      );
      throw error;
    }
  }

  async syncBatch(items: { doc: any; type: string }[]) {
    if (!this.index) return;

    try {
      const documents = items.map((item) => ({
        ...item.doc,
        type: item.type,
      }));
      await this.index.addDocuments(documents, { primaryKey: 'id' });
      this.logger.log(`[MeiliSearch] Synced batch of ${items.length} docs`);
    } catch (error) {
      this.logger.error(`[MeiliSearch] Batch sync failed: ${error.message}`);
      throw error;
    }
  }
}
