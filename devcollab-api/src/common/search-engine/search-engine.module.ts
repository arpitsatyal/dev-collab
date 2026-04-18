import { Global, Module } from '@nestjs/common';
import { MeiliSearchAdapter } from './meilisearch.adapter';
import { SearchEnginePort } from './ports/search-engine.port';

@Global()
@Module({
  providers: [
    {
      provide: SearchEnginePort,
      useClass: MeiliSearchAdapter,
    },
  ],
  exports: [SearchEnginePort],
})
export class SearchEngineModule {}
