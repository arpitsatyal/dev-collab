import { Module } from '@nestjs/common';
import { ToolService } from './services/tool.service';
import { ToolRegistry } from './ports/tool.port';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkItemsModule } from '../work-items/work-items.module';
import { SnippetsModule } from '../snippets/snippets.module';
import { DocsModule } from '../docs/docs.module';

@Module({
  imports: [
    WorkspacesModule,
    WorkItemsModule,
    SnippetsModule,
    DocsModule,
  ],
  providers: [
    { provide: ToolRegistry, useClass: ToolService },
  ],
  exports: [ToolRegistry],
})
export class AiToolsModule {}
