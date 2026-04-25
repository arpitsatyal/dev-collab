import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { UsersModule } from './modules/users/users.module';
import { SnippetsModule } from './modules/snippets/snippets.module';
import { WorkItemsModule } from './modules/work-items/work-items.module';
import { DocsModule } from './modules/docs/docs.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { MessageModule } from './modules/message/message.module';
import { QueueModule } from './modules/queue/queue.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { VectorStoreModule } from './common/vector-store/vector-store.module';
import { SyncEventModule } from './common/sync-events/sync-event.module';
import { DrizzleModule } from './common/drizzle/drizzle.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { SessionAuthGuard } from './common/guards/auth.guard';
import { SearchEngineModule } from './common/search-engine/search-engine.module';
import { SearchModule } from './modules/search/search.module';
import { MissionModule } from './modules/mission/mission.module';
import { AgentModule } from './modules/ai/agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    AuthModule,
    WorkspacesModule,
    UsersModule,
    SnippetsModule,
    WorkItemsModule,
    DocsModule,
    ChatModule,
    AiModule,
    AgentModule,
    MessageModule,
    QueueModule,
    CollaborationModule,
    WebhooksModule,
    VectorStoreModule,
    SyncEventModule,
    DrizzleModule,
    SearchEngineModule,
    SearchModule,
    MissionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
