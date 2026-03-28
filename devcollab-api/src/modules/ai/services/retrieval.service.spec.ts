import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalService } from './retrieval.service';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { VectorStorePort } from 'src/common/vector-store/ports/vector-store.port';
import { Document } from '@langchain/core/documents';

describe('RetrievalService', () => {
  let service: RetrievalService;
  
  const mockVectorStore = {
    search: jest.fn(),
  };

  const mockDrizzle = {
    db: {
      query: {
        workspaces: { findMany: jest.fn() },
        workItems: { findMany: jest.fn() },
        snippets: { findMany: jest.fn() },
        docs: { findMany: jest.fn() },
      }
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalService,
        { provide: DrizzleService, useValue: mockDrizzle },
        { provide: VectorStorePort, useValue: mockVectorStore }
      ],
    }).compile();

    service = module.get<RetrievalService>(RetrievalService);
    jest.clearAllMocks();
    
    mockDrizzle.db.query.workspaces.findMany.mockResolvedValue([]);
    mockDrizzle.db.query.workItems.findMany.mockResolvedValue([]);
    mockDrizzle.db.query.snippets.findMany.mockResolvedValue([]);
    mockDrizzle.db.query.docs.findMany.mockResolvedValue([]);
  });

  describe('performHybridSearch', () => {
    it('should retrieve and deduplicate documents from vector store', async () => {
      // Mock search hit
      mockVectorStore.search.mockResolvedValue([
        [new Document({ pageContent: 'Exact same content returned twice' }), 0.9]
      ]);

      const results = await service.performHybridSearch(
        ['query1', 'query2'], // Simulating expanding to 2 queries
        'query1'
      );
      
      // Even though search executes twice, deduplication should reduce it to 1
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.9);
      expect(mockVectorStore.search).toHaveBeenCalledTimes(2);
    });

    it('should inject DB keyword search results and rank them highly', async () => {
      mockVectorStore.search.mockResolvedValue([]);
      
      mockDrizzle.db.query.workItems.findMany.mockResolvedValue([
        { workspaceId: 'ws-1', title: 'Fix bug', status: 'TODO', description: 'Urgent', workspace: { title: 'Core Base' } }
      ]);

      const results = await service.performHybridSearch(['query1'], 'query1', { workspaceId: 'ws-1' });
      
      expect(results).toHaveLength(1);
      expect(results[0].doc.pageContent).toContain('Work Item Title: Fix bug');
      expect(results[0].score).toBe(0.9); // Keyword gets artificially scaled to 0.9 as defined
    });

    it('should ignore low-scored vector results (< 0.5 cutoff)', async () => {
      mockVectorStore.search.mockResolvedValue([
        [new Document({ pageContent: 'Terrible match' }), 0.2]
      ]);

      const results = await service.performHybridSearch(['query1'], 'query1');
      
      expect(results).toHaveLength(0); // Cutoff is 0.5
    });
  });
});
