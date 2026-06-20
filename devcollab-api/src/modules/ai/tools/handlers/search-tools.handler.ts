import { Injectable } from '@nestjs/common';
import { IAiTool } from '../ports/tools.port';
import { semanticSearchSchema } from '../schema/search-tools.schema';
import type { SemanticSearchArgs } from '../types/tools.types';
import { RetrievalPort } from '../../ports/retrieval.port';

@Injectable()
export class SearchToolsHandler {
  constructor(
    private readonly retrievalPort: RetrievalPort,
  ) {}

  async handleSemanticSearch(
    args: SemanticSearchArgs,
    defaultId: string,
  ): Promise<string> {
    const { searchQuery: query, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to run semantic search.';

    const variations = await this.retrievalPort.generateQueryVariations(query);
    const results = await this.retrievalPort.performHybridSearch(
      variations,
      query,
      { workspaceId }
    );

    if (results.length === 0) {
      return 'No relevant content found for that query.';
    }

    // Map to docs instead of full hits to reduce context size
    return JSON.stringify(results.map(r => r.doc));
  }

  getTools(workspaceId: string): IAiTool[] {
    const tools: IAiTool[] = [];

    tools.push({
      name: 'semantic_search',
      description:
        'Perform a broad semantic search across snippets, docs, and work items.',
      schema: semanticSearchSchema,
      invoke: (args: SemanticSearchArgs) =>
        this.handleSemanticSearch(args, workspaceId),
    });

    return tools;
  }
}
