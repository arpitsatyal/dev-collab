import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalService } from './retrieval.service';
import { VectorStorePort } from 'src/common/vector-store/ports/vector-store.port';
import { Document } from '@langchain/core/documents';
import { WorkspaceRepository } from 'src/modules/workspaces/repositories/workspace.repository';
import { WorkItemRepository } from 'src/modules/work-items/repositories/work-item.repository';
import { SnippetRepository } from 'src/modules/snippets/repositories/snippet.repository';
import { DocRepository } from 'src/modules/docs/repositories/doc.repository';
import { GenerationPort } from '../ports/generation.port';

describe('RetrievalService', () => {
  let service: RetrievalService;

  const mockVectorStore = {
    search: jest.fn(),
  };

  const mockWorkspaceRepo = {
    findManyBySearch: jest.fn(),
  };

  const mockWorkItemRepo = {
    findManyBySearch: jest.fn(),
  };

  const mockSnippetRepo = {
    findManyBySearch: jest.fn(),
  };

  const mockDocRepo = {
    findManyBySearch: jest.fn(),
  };

  const mockGenerationPort = {
    generateText: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalService,
        { provide: WorkspaceRepository, useValue: mockWorkspaceRepo },
        { provide: WorkItemRepository, useValue: mockWorkItemRepo },
        { provide: SnippetRepository, useValue: mockSnippetRepo },
        { provide: DocRepository, useValue: mockDocRepo },
        { provide: VectorStorePort, useValue: mockVectorStore },
        { provide: GenerationPort, useValue: mockGenerationPort },
      ],
    }).compile();

    service = module.get<RetrievalService>(RetrievalService);
    jest.clearAllMocks();

    mockWorkspaceRepo.findManyBySearch.mockResolvedValue([]);
    mockWorkItemRepo.findManyBySearch.mockResolvedValue([]);
    mockSnippetRepo.findManyBySearch.mockResolvedValue([]);
    mockDocRepo.findManyBySearch.mockResolvedValue([]);
    mockGenerationPort.generateText.mockResolvedValue('');
  });

  describe('performHybridSearch', () => {
    it('should retrieve and deduplicate documents from vector store', async () => {
      // Mock search hit
      mockVectorStore.search.mockResolvedValue([
        [
          new Document({ pageContent: 'Exact same content returned twice' }),
          0.9,
        ],
      ]);

      const results = await service.performHybridSearch(
        ['query1', 'query2'], // Simulating expanding to 2 queries
        'query1',
      );

      // Even though search executes twice, deduplication should reduce it to 1
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.9);
      expect(mockVectorStore.search).toHaveBeenCalledTimes(2);
    });

    it('should inject DB keyword search results and rank them highly', async () => {
      mockVectorStore.search.mockResolvedValue([]);

      mockWorkItemRepo.findManyBySearch.mockResolvedValue([
        {
          workspaceId: 'ws-1',
          title: 'Fix bug',
          status: 'TODO',
          description: 'Urgent',
          workspace: { title: 'Core Base' },
        },
      ]);

      const results = await service.performHybridSearch(['query1'], 'query1', {
        workspaceId: 'ws-1',
      });

      expect(results).toHaveLength(1);
      expect(results[0].doc.pageContent).toContain('Work Item Title: Fix bug');
      expect(results[0].score).toBe(0.9); // Keyword gets artificially scaled to 0.9 as defined
    });

    it('should ignore low-scored vector results (< 0.5 cutoff)', async () => {
      mockVectorStore.search.mockResolvedValue([
        [new Document({ pageContent: 'Terrible match' }), 0.2],
      ]);

      const results = await service.performHybridSearch(['query1'], 'query1');

      expect(results).toHaveLength(0); // Cutoff is 0.5
    });
  });
});
