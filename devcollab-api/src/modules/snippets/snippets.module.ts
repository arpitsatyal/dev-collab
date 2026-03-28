import { Module } from '@nestjs/common';
import { SnippetsService } from './snippets.service';
import { SnippetsController } from './snippets.controller';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';
import { SnippetRepository } from './repositories/snippet.repository';

@Module({
  imports: [SyncEventModule],
  providers: [SnippetsService, SnippetRepository],
  controllers: [SnippetsController],
})
export class SnippetsModule {}
