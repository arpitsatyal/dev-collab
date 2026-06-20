import { Module } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';
import { CollaborationPort } from './ports/collaboration.port';
import { LiveblocksAdapter } from './liveblocks.adapter';

@Module({
  providers: [
    CollaborationService,
    { provide: CollaborationPort, useClass: LiveblocksAdapter },
  ],
  controllers: [CollaborationController],
  exports: [CollaborationService, CollaborationPort],
})
export class CollaborationModule { }
