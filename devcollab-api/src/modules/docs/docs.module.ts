import { Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';
import { DocRepository } from './repositories/doc.repository';

@Module({
  imports: [SyncEventModule],
  providers: [DocsService, DocRepository],
  controllers: [DocsController],
  exports: [DocsService, DocRepository],
})
export class DocsModule {}
