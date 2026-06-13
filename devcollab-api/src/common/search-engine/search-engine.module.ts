import { Global, Module } from '@nestjs/common';
import { MeiliSearchAdapter } from './meilisearch.adapter';
import { SearchEnginePort } from './ports/search-engine.port';
import { SearchFactory } from './search.factory';

@Global()
@Module({
  providers: [
    MeiliSearchAdapter,
    SearchFactory,
    {
      provide: SearchEnginePort,
      useFactory: (factory: SearchFactory) => factory.create(),
      inject: [SearchFactory],
    },
  ],
  exports: [SearchEnginePort],
})
export class SearchEngineModule {}
