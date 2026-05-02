import { MissionController } from './mission.controller';
import { Module } from '@nestjs/common';
import { AgentModule } from '../ai/agent/agent.module';
import { MissionService } from './mission.service';
import { MissionConsumer } from './mission.consumer';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [AgentModule, QueueModule],
  controllers: [MissionController],
  providers: [MissionService, MissionConsumer],
  exports: [MissionService],
})
export class MissionModule {}
