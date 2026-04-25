import { MissionController } from './mission.controller';
import { Module } from '@nestjs/common';
import { AgentModule } from '../ai/agent/agent.module';
import { MissionService } from './mission.service';

@Module({
  imports: [
    AgentModule,
  ],
  controllers: [MissionController],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule { }
