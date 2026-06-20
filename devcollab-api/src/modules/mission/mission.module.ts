import { MissionController } from './mission.controller';
import { Module } from '@nestjs/common';
import { AgentModule } from '../ai/agent/agent.module';
import { MissionService } from './services/mission.service';
import { MissionConsumer } from './mission.consumer';
import { QueueModule } from '../queue/queue.module';
import { MissionPromptsService } from './services/mission-prompts.service';
import { MissionRunnerService } from './services/mission-runner.service';
import { MissionTaskHandler } from './handlers/mission-task.handler';

@Module({
  imports: [AgentModule, QueueModule],
  controllers: [MissionController],
  providers: [
    MissionService,
    MissionConsumer,
    MissionPromptsService,
    MissionRunnerService,
    MissionTaskHandler,
  ],
  exports: [MissionService, MissionRunnerService],
})
export class MissionModule { }
