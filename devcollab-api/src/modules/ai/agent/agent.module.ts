import { Module } from '@nestjs/common';
import { AgentEventsService } from './services/agent-events.service';

@Module({
  providers: [AgentEventsService],
  exports: [AgentEventsService],
})
export class AgentModule { }
