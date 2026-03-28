import { Module } from '@nestjs/common';
import { WorkItemsController } from './work-items.controller';
import { DueWorkItemsController } from './due-work-items.controller';
import { WorkItemsService } from './work-items.service';
import { QueueModule } from 'src/modules/queue/queue.module';
import { SyncEventModule } from 'src/common/sync-events/sync-event.module';
import { WorkItemRepository } from './repositories/work-item.repository';

@Module({
  imports: [QueueModule, SyncEventModule],
  controllers: [WorkItemsController, DueWorkItemsController],
  providers: [WorkItemsService, WorkItemRepository],
  exports: [WorkItemsService],
})
export class WorkItemsModule {}
