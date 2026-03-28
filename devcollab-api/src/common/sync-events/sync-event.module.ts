import { Module } from '@nestjs/common';
import { SyncEventService } from './sync-event.service';

import { SyncEventPort } from './ports/sync-event.port';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [{ provide: SyncEventPort, useClass: SyncEventService }],
  exports: [SyncEventPort],
})
export class SyncEventModule {}
