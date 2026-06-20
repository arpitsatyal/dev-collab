import { randomUUID } from 'crypto';
import { SourceCodeFile } from '../ports/source-code.port';
import { SNIPPET_EXTENSIONS } from './constants';
import type { ProcessedFiles } from '../types/workspaces.types';

export class WorkspaceFileProcessor {
  static processFiles(
    files: SourceCodeFile[],
    workspaceId: string,
    authorId: string,
  ): ProcessedFiles {
    const snippetsData: ProcessedFiles['snippetsData'] = [];
    const docsData: ProcessedFiles['docsData'] = [];

    for (const file of files) {
      const { ext, fileName, content } = file;

      if (ext === 'md') {
        docsData.push({
          label: fileName,
          workspaceId,
          roomId: randomUUID(),
          content: { type: 'doc', content: content },
        });
      } else if (SNIPPET_EXTENSIONS.includes(ext || '')) {
        snippetsData.push({
          title: fileName.replace(`.${ext}`, ''),
          language: ext || 'plaintext',
          extension: ext || '',
          content: JSON.stringify(content),
          workspaceId,
          authorId,
        });
      }
    }

    return { snippetsData, docsData };
  }
}
