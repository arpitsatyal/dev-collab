import { MissionController } from './mission.controller';
import { MissionRepository, MissionStepRepository } from './repositories/mission.repository';
import { AiModule } from '../ai/ai.module';
import { forwardRef, Module } from '@nestjs/common';
import { MissionService } from './mission.service';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [MissionController],
  providers: [MissionService, MissionRepository, MissionStepRepository],
  exports: [MissionService],
})

export class MissionModule { }
