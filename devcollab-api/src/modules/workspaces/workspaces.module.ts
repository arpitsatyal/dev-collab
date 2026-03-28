import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';
import { WorkspaceRepository } from './infrastructure/workspace.repository';
import { WorkspaceImportRepository } from './infrastructure/workspace-import.repository';
import { GithubClient } from './infrastructure/github.client';
import { SourceCodePort } from './ports/source-code.port';

@Module({
  imports: [SyncEventModule],
  providers: [
    WorkspacesService,
    WorkspaceRepository,
    WorkspaceImportRepository,
    { provide: SourceCodePort, useClass: GithubClient },
  ],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
