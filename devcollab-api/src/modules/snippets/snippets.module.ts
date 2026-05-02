import { Module } from '@nestjs/common';
import { SnippetsService } from './snippets.service';
import { SnippetsController } from './snippets.controller';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';

@Module({
  imports: [SyncEventModule],
  providers: [SnippetsService],
  controllers: [SnippetsController],
  exports: [SnippetsService],
})
export class SnippetsModule {}
