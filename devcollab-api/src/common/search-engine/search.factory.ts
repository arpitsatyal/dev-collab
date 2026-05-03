import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearchAdapter } from './meilisearch.adapter';
import { SearchEnginePort } from './ports/search-engine.port';

@Injectable()
export class SearchFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly meiliSearchAdapter: MeiliSearchAdapter,
  ) {}

  create(): SearchEnginePort {
    const provider = this.configService.get<string>('SEARCH_PROVIDER') || 'meilisearch';

    switch (provider.toLowerCase()) {
      case 'meilisearch':
        return this.meiliSearchAdapter;
      default:
        return this.meiliSearchAdapter;
    }
  }
}
