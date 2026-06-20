import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistry, IAiTool } from './ports/tools.port';
import { WorkspaceActionsPort } from 'src/modules/workspaces/ports/workspace-actions.port';
import { SnippetToolsHandler } from './handlers/snippet-tools.handler';
import { DocToolsHandler } from './handlers/doc-tools.handler';
import { WorkItemToolsHandler } from './handlers/work-item-tools.handler';
import { WorkspaceToolsHandler } from './handlers/workspace-tools.handler';
import { SearchToolsHandler } from './handlers/search-tools.handler';

@Injectable()
export class ToolsService implements ToolRegistry {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    private readonly workspacesService: WorkspaceActionsPort,
    private readonly snippetHandler: SnippetToolsHandler,
    private readonly docHandler: DocToolsHandler,
    private readonly workItemHandler: WorkItemToolsHandler,
    private readonly workspaceHandler: WorkspaceToolsHandler,
    private readonly searchHandler: SearchToolsHandler,
  ) {}

  async getTools(workspaceId: string): Promise<IAiTool[]> {
    try {
      // Fetch workspace owner to use as authorId for creations
      const workspace = await this.workspacesService.getWorkspace(workspaceId);
      const authorId = workspace.ownerId;

      return [
        ...this.snippetHandler.getTools(workspaceId, authorId),
        ...this.docHandler.getTools(workspaceId),
        ...this.workItemHandler.getTools(workspaceId, authorId),
        ...this.workspaceHandler.getTools(workspaceId),
        ...this.searchHandler.getTools(workspaceId),
      ];
    } catch (error) {
      this.logger.error(
        `Failed to initialize tools for workspace ${workspaceId}: ${error.message}`,
      );
      return [];
    }
  }
}
