import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';
import { GithubClient } from './adapters/github.client';
import { SourceCodePort } from './ports/source-code.port';
import { WorkspaceActionsPort } from './ports/workspace-actions.port';

@Module({
  imports: [SyncEventModule],
  providers: [
    WorkspacesService,
    { provide: WorkspaceActionsPort, useClass: WorkspacesService },
    { provide: SourceCodePort, useClass: GithubClient },
  ],
  controllers: [WorkspacesController],
  exports: [WorkspacesService, WorkspaceActionsPort],
})
export class WorkspacesModule { }
