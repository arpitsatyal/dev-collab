import { Test, TestingModule } from '@nestjs/testing';
import { SnippetsService } from './snippets.service';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { SnippetRepository } from './repositories/snippet.repository';

describe('SnippetsService', () => {
  let service: SnippetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnippetsService,
        { provide: SyncEventPort, useValue: {} },
        { provide: SnippetRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<SnippetsService>(SnippetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
