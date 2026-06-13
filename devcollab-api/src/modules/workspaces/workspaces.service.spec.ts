import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceImportRepository } from './repositories/workspace-import.repository';
import { SourceCodePort } from './ports/source-code.port';

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: SyncEventPort, useValue: {} },
        { provide: WorkspaceRepository, useValue: {} },
        { provide: WorkspaceImportRepository, useValue: {} },
        { provide: SourceCodePort, useValue: {} },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
