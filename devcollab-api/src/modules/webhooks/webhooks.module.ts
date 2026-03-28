import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { VectorSyncController } from './vector-sync.controller';
import { VectorStoreModule } from 'src/common/vector-store/vector-store.module';
import { CollaborationWebhookController } from './collaboration-webhook.controller';
import { CollaborationWebhookService } from './collaboration-webhook.service';
import { QueueModule } from '../queue/queue.module';
import { RawBodyMiddleware } from 'src/common/middlewares/raw-body.middleware';
import { UsersModule } from '../users/users.module';
import { DocsModule } from '../docs/docs.module';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
  imports: [
    VectorStoreModule,
    QueueModule,
    UsersModule,
    DocsModule,
    CollaborationModule,
  ],
  controllers: [VectorSyncController, CollaborationWebhookController],
  providers: [CollaborationWebhookService],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({ path: 'webhooks/collaboration', method: RequestMethod.POST });
  }
}
