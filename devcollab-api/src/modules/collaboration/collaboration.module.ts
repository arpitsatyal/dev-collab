import { Module } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';
import { CollaborationPort } from './ports/collaboration.port';

@Module({
  providers: [
    { provide: CollaborationPort, useClass: CollaborationService },
  ],
  controllers: [CollaborationController],
  exports: [CollaborationPort],
})
export class CollaborationModule {}
