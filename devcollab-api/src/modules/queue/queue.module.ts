import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueuePort } from './ports/queue.port';

@Module({
  providers: [{ provide: QueuePort, useClass: QueueService }],
  exports: [QueuePort],
})
export class QueueModule {}
