import { Injectable } from '@nestjs/common';
import { IAiTool } from '../ports/tools.port';
import { SnippetsService } from 'src/modules/snippets/snippets.service';
import { semanticSearchSchema } from '../schema/search-tools.schema';
import { WorkItemsService } from 'src/modules/work-items/work-items.service';
import { DocsService } from 'src/modules/docs/docs.service';
import type { SemanticSearchArgs } from '../types/tools.types';

@Injectable()
export class SearchToolsHandler {
  constructor(
    private readonly snippetsService: SnippetsService,
    private readonly workItemsService: WorkItemsService,
    private readonly docsService: DocsService,
  ) {}

  async handleSemanticSearch(
    args: SemanticSearchArgs,
    defaultId: string,
  ): Promise<string> {
    const { searchQuery: query, workspaceId: overrideId } = args;
    const workspaceId = overrideId || defaultId;
    if (!workspaceId) return 'Workspace ID is required to run semantic search.';

    const [snippets, workItems, docs] = await Promise.all([
      this.snippetsService.searchSnippets(workspaceId, query, 3),
      this.workItemsService.searchWorkItems(workspaceId, query, 3),
      this.docsService.searchDocs(workspaceId, query, 3),
    ]);

    if (snippets.length === 0 && workItems.length === 0 && docs.length === 0) {
      return 'No relevant content found for that query.';
    }

    return JSON.stringify({ snippets, workItems, docs });
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
