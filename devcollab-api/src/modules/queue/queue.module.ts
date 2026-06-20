import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueuePort } from './ports/queue.port';
import { QueueProviderPort } from './ports/queue-provider.port';
import { SqsAdapter } from './sqs.adapter';

@Module({
  providers: [
    QueueService,
    { provide: QueuePort, useClass: QueueService },
    { provide: QueueProviderPort, useClass: SqsAdapter },
  ],
  exports: [QueuePort],
})
export class QueueModule { }
