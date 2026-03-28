import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { snippets, docs } from 'src/common/drizzle/schema';
import { v4 as uuid } from 'uuid';

type SnippetInsert = {
  title: string;
  language: string;
  extension: string;
  content: string;
  workspaceId: string;
  authorId?: string;
};

type DocInsert = {
  label: string;
  workspaceId: string;
  roomId: string;
  content?: unknown;
};

@Injectable()
export class WorkspaceImportRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async createSnippets(data: SnippetInsert[]) {
    if (data.length === 0) return;
    await this.drizzle.db
      .insert(snippets)
      .values(data.map((s) => ({ id: uuid(), ...s })));
  }

  async createDocs(data: DocInsert[]) {
    if (data.length === 0) return;
    await this.drizzle.db
      .insert(docs)
      .values(data.map((d) => ({ id: uuid(), ...d })));
  }
}
