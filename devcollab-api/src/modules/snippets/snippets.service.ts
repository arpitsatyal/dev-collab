import { Injectable, NotFoundException } from '@nestjs/common';
import { SnippetsCreateDto, SnippetsUpdateDto } from './dto/snippets.dto';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { SnippetRepository } from './repositories/snippet.repository';

@Injectable()
export class SnippetsService {
  constructor(
    private syncPort: SyncEventPort,
    private readonly snippetRepo: SnippetRepository,
  ) {}

  async getSnippet(snippetId: string) {
    const snippet = await this.snippetRepo.findUnique(snippetId);
    if (!snippet)
      throw new NotFoundException(`Snippet with id ${snippetId} not found`);
    return snippet;
  }

  async getSnippetsByWorkspace(workspaceId: string) {
    return this.snippetRepo.findByWorkspaceId(workspaceId);
  }

  async createSnippet(
    workspaceId: string,
    authorId: string,
    dto: SnippetsCreateDto,
  ) {
    const snippet = await this.snippetRepo.create({
      title: dto.title,
      language: dto.language,
      content: dto.content,
      extension: dto.extension,
      authorId,
      workspaceId,
    });

    await this.syncPort.publishSyncEvent('snippet', snippet);
    return snippet;
  }

  async updateSnippet(snippetId: string, dto: SnippetsUpdateDto) {
    const { title, language, content, extension, lastEditedById } = dto;

    const updated = await this.snippetRepo.update(snippetId, {
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
}
