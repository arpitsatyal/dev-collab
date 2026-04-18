import { randomUUID } from 'crypto';
import { SourceCodeFile } from '../ports/source-code.port';
import { SNIPPET_EXTENSIONS } from './constants';

export interface ProcessedFiles {
  snippetsData: {
    title: string;
    language: string;
    extension: string;
    content: string;
    workspaceId: string;
    authorId: string;
  }[];
  docsData: {
    label: string;
    workspaceId: string;
    roomId: string;
    content: unknown;
  }[];
}

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
