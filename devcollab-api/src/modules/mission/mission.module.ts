import { MissionController } from './mission.controller';
import { MissionRepository, MissionStepRepository } from './repositories/mission.repository';
import { MissionLogRepository } from './repositories/mission-log.repository';
import { AiModule } from '../ai/ai.module';
import { AgentModule } from '../ai/agent/agent.module';
import { forwardRef, Module } from '@nestjs/common';
import { MissionService } from './mission.service';

@Module({
  imports: [
    forwardRef(() => AiModule),
    forwardRef(() => AgentModule),
  ],
  controllers: [MissionController],
  providers: [MissionService, MissionRepository, MissionStepRepository, MissionLogRepository],
  exports: [MissionService, MissionRepository, MissionStepRepository, MissionLogRepository],
})

export class MissionModule { }
