import { Controller, Get, Query } from '@nestjs/common';
import { SearchEnginePort } from '../../common/search-engine/ports/search-engine.port';

@Controller('search')
export class SearchController {
  constructor(private readonly searchEngine: SearchEnginePort) { }

  @Get()
  async search(@Query('query') query: string) {
    if (!query) return [];
    return this.searchEngine.search(query);
  }
}
