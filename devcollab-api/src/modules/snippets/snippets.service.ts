import { Injectable, NotFoundException } from '@nestjs/common';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { SnippetRepository } from './repositories/snippet.repository';
import type { CreateSnippetRequest, UpdateSnippetRequest } from './interfaces/snippets.interfaces';

@Injectable()
export class SnippetsService {
  constructor(
    private syncPort: SyncEventPort,
    private readonly snippetRepo: SnippetRepository,
  ) { }

  async getSnippet(snippetId: string) {
    const snippet = await this.snippetRepo.findUnique(snippetId);
    if (!snippet)
      throw new NotFoundException(`Snippet with id ${snippetId} not found`);
    return snippet;
  }

  async getSnippetsByWorkspace(workspaceId: string) {
    return this.snippetRepo.findByWorkspaceId(workspaceId);
  }

  async createSnippet(request: CreateSnippetRequest) {
    const { workspaceId, authorId, title, language, content, extension } = request;
    const snippet = await this.snippetRepo.create({
      title,
      language,
      content,
      extension,
      authorId,
      workspaceId,
    });

    await this.syncPort.publishSyncEvent('snippet', snippet);
    return snippet;
  }

  async updateSnippet(request: UpdateSnippetRequest) {
    const { id, title, language, content, extension, lastEditedById } = request;

    const updated = await this.snippetRepo.update(id, {
      ...(title && { title }),
      ...(language && { language }),
      ...(content && { content }),
      ...(extension && { extension }),
      ...(lastEditedById && { lastEditedById }),
      updatedAt: new Date(),
    });

    if (!updated) throw new NotFoundException('Snippet not found');

    await this.syncPort.publishSyncEvent('snippet', updated);
    return updated;
  }

  async searchSnippets(workspaceId: string, query: string, limit?: number) {
    return this.snippetRepo.findManyBySearch(workspaceId, query, limit);
  }
}
