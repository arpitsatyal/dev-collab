import { Test, TestingModule } from '@nestjs/testing';
import { DocsService } from './docs.service';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { DocRepository } from './repositories/doc.repository';

describe('DocsService', () => {
  let service: DocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocsService,
        { provide: SyncEventPort, useValue: {} },
        { provide: DocRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<DocsService>(DocsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
