import { MissionController } from './mission.controller';
import { MissionRepository, MissionStepRepository } from './repositories/mission.repository';
import { MissionLogRepository } from './repositories/mission-log.repository';
import { Module } from '@nestjs/common';
import { AgentModule } from '../ai/agent/agent.module';
import { MissionService } from './mission.service';

@Module({
  imports: [
    AgentModule,
  ],
  controllers: [MissionController],
  providers: [MissionService, MissionRepository, MissionStepRepository, MissionLogRepository],
  exports: [MissionService, MissionRepository, MissionStepRepository, MissionLogRepository],
})

export class MissionModule { }
