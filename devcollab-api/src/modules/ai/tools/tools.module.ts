import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolRegistry } from './ports/tools.port';
import { SnippetsModule } from '../../snippets/snippets.module';
import { DocsModule } from '../../docs/docs.module';
import { WorkItemsModule } from '../../work-items/work-items.module';
import { WorkspacesModule } from '../../workspaces/workspaces.module';
import { SnippetToolsHandler } from './handlers/snippet-tools.handler';
import { DocToolsHandler } from './handlers/doc-tools.handler';
import { WorkItemToolsHandler } from './handlers/work-item-tools.handler';
import { WorkspaceToolsHandler } from './handlers/workspace-tools.handler';
import { SearchToolsHandler } from './handlers/search-tools.handler';

@Module({
  imports: [
    SnippetsModule,
    DocsModule,
    WorkItemsModule,
    WorkspacesModule,
  ],
  providers: [
    SnippetToolsHandler,
    DocToolsHandler,
    WorkItemToolsHandler,
    WorkspaceToolsHandler,
    SearchToolsHandler,
    {
      provide: ToolRegistry,
      useClass: ToolsService,
    },
  ],
  exports: [ToolRegistry],
})
export class ToolsModule {}
