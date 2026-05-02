import { Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { VectorStorePort } from 'src/common/vector-store/ports/vector-store.port';
import {
  RetrievalPort,
  SearchHit,
  SearchDocument,
} from '../ports/retrieval.port';
import { WorkspaceRepository } from '../../workspaces/repositories/workspace.repository';
import { WorkItemRepository } from '../../work-items/repositories/work-item.repository';
import { SnippetRepository } from '../../snippets/repositories/snippet.repository';
import { DocRepository } from '../../docs/repositories/doc.repository';

@Injectable()
export class RetrievalService implements RetrievalPort {
  private readonly scoreThreshold = 0.5;
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly workItemRepo: WorkItemRepository,
    private readonly snippetRepo: SnippetRepository,
    private readonly docRepo: DocRepository,
    private readonly vectorStorePort: VectorStorePort,
  ) { }

  async generateQueryVariations(
    query: string,
    llm: BaseChatModel,
  ): Promise<string[]> {
    const prompt = `You are an AI assistant helping to expand a user's search query.
    Generate 3 alternative versions of the following query to improve search retrieval. 
    Focus on synonyms, related concepts, and technical terms relevant to software development.
    Return ONLY the 3 queries, one per line, without any numbering or extra text.
    
    Query: "${query}"`;

    try {
      const content = await llm.pipe(new StringOutputParser()).invoke(prompt);
      const variations = content
        .split('\n')
        .filter((q) => q.trim().length > 0)
        .slice(0, 3);
      return [query, ...variations];
    } catch (e) {
      this.logger.warn(
        `Query expansion failed: ${e instanceof Error ? e.message : e}`,
      );
      return [query];
    }
  }

  private async keywordSearch(
    query: string,
    filters?: Record<string, any>,
  ): Promise<SearchDocument[]> {
    const results: SearchDocument[] = [];
    const workspaceId = filters?.workspaceId;

    try {
      if (!workspaceId) {
        const foundWorkspaces =
          await this.workspaceRepo.findManyBySearch(query);

        results.push(
          ...foundWorkspaces.map((w) => ({
            pageContent: `Workspace Title: ${w.title}\nDescription: ${w.description || 'No description'}`,
            metadata: {
              type: 'workspace',
              workspaceId: w.id,
              workspaceTitle: w.title,
            },
          })),
        );
      }

      if (workspaceId) {
        const [foundWorkItems, foundSnippets, foundDocs] = await Promise.all([
          this.workItemRepo.findManyBySearch(workspaceId, query),
          this.snippetRepo.findManyBySearch(workspaceId, query),
          this.docRepo.findManyBySearch(workspaceId, query),
        ]);

        results.push(
          ...foundWorkItems.map((w: any) => ({
            pageContent: `Work Item Title: ${w.title}\nStatus: ${w.status}\nDescription: ${w.description || 'No description'}`,
            metadata: {
              type: 'workItem',
              workspaceId: w.workspaceId,
              workspaceTitle: w.workspace?.title,
            },
          })),
        );

        results.push(
          ...foundSnippets.map((s: any) => ({
            pageContent: `Snippet Title: ${s.title}\nLanguage: ${s.language}\nContent:\n${s.content}`,
            metadata: {
              type: 'snippet',
              workspaceId: s.workspaceId,
              workspaceTitle: s.workspace?.title,
            },
          })),
        );

        results.push(
          ...foundDocs.map((d: any) => {
            const contentStr =
              typeof d.content === 'string'
                ? d.content
                : JSON.stringify(d.content || {});
            return {
              pageContent: `Doc Label: ${d.label}\nContent:\n${contentStr}`,
              metadata: {
                type: 'doc',
                workspaceId: d.workspaceId,
                workspaceTitle: d.workspace?.title,
              },
            };
          }),
        );
      }
    } catch (e) {
      this.logger.error(`Keyword search failed: ${e.message}`);
    }
    return results;
  }

  async performHybridSearch(
    queries: string[],
    originalQuery: string,
    filters?: Record<string, any>,
  ): Promise<SearchHit[]> {
    const vectorSearchPromises = queries.map((q) =>
      this.vectorStorePort.search(q, 5, filters),
    );

    const vectorResultsArrays = await Promise.all(vectorSearchPromises);
    const allVectorResults = vectorResultsArrays.flat();

    const combinedResults: SearchHit[] = [];
    const seenContent = new Set<string>();

    allVectorResults.forEach(([doc, score]: [Document, number]) => {
      const signature = doc.pageContent.substring(0, 50);
      if (!seenContent.has(signature)) {
        seenContent.add(signature);
        combinedResults.push({ doc, score });
      }
    });

    const keywordResults = await this.keywordSearch(originalQuery, filters);

    keywordResults.forEach((doc) => {
      const isDuplicate = combinedResults.some((hit) =>
        hit.doc.pageContent.includes(doc.pageContent.substring(0, 50)),
      );
      if (!isDuplicate) {
        combinedResults.push({ doc, score: 0.9 });
      }
    });

    combinedResults.sort((a, b) => b.score - a.score);

    const finalResults = combinedResults
      .filter((hit) => hit.score >= this.scoreThreshold)
      .slice(0, 10);

    return finalResults;
  }
}
