import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SyncEventPort } from 'src/common/sync-events/ports/sync-event.port';
import { DocRepository } from './repositories/doc.repository';
import type {
  CreateDocRequest,
  UpdateDocRequest,
} from './interfaces/docs.interfaces';

@Injectable()
export class DocsService {
  constructor(
    private syncPort: SyncEventPort,
    private readonly docRepo: DocRepository,
  ) {}

  async getDoc(docId: string) {
    const doc = await this.docRepo.findUnique(docId);
    if (!doc) throw new NotFoundException(`Doc with id ${docId} not found`);
    return doc;
  }

  async getDocs(workspaceId: string) {
    return this.docRepo.findByWorkspaceId(workspaceId);
  }

  async createDoc(request: CreateDocRequest) {
    const { content, ...rest } = request;

    const doc = await this.docRepo.create({
      ...rest,
      roomId: `docs_${uuidv4()}`,
      content: this.normalizeContent(content),
    });

    await this.syncPort.publishSyncEvent('doc', doc);
    return doc;
  }

  async updateDoc(request: UpdateDocRequest) {
    const { id, content, ...rest } = request;

    const updated = await this.docRepo.update(id, {
      ...rest,
      content: this.normalizeContent(content),
      updatedAt: new Date(),
    });

    if (!updated) throw new NotFoundException('Doc not found');

    await this.syncPort.publishSyncEvent('doc', updated);
    return updated;
  }

  async searchDocs(workspaceId: string, query: string, limit?: number) {
    return this.docRepo.findManyBySearch(workspaceId, query, limit);
  }

  private normalizeContent(content: unknown): string | undefined {
    if (content === undefined || content === null) return undefined;
    if (typeof content === 'string') return content;

    if (typeof content === 'object') {
      const maybeDoc = content as { content?: unknown };
      if (typeof maybeDoc.content === 'string') return maybeDoc.content;
    }

    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
}
