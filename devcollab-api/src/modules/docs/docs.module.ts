import { Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';

@Module({
  imports: [SyncEventModule],
  providers: [DocsService],
  controllers: [DocsController],
  exports: [DocsService],
})
export class DocsModule { }
