import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/common/drizzle/drizzle.service';
import { snippets, docs } from 'src/common/drizzle/schema';
import { v4 as uuid } from 'uuid';
import type {
  DocImportData,
  SnippetImportData,
} from '../types/workspaces.types';

@Injectable()
export class WorkspaceImportRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async createSnippets(data: SnippetImportData[]) {
    if (data.length === 0) return;
    await this.drizzle.db
      .insert(snippets)
      .values(data.map((s) => ({ id: uuid(), ...s })));
  }

  async createDocs(data: DocImportData[]) {
    if (data.length === 0) return;
    await this.drizzle.db
      .insert(docs)
      .values(data.map((d) => ({ id: uuid(), ...d })));
  }
}
