import { Module, forwardRef } from '@nestjs/common';
import { MissionModule } from '../../../modules/mission/mission.module';
import { AiModule } from '../ai.module';
import { AgentNodesService } from './services/agent-nodes.service';
import { AgentPromptsService } from './services/agent-prompts.service';
import { AgentGraphFactoryService } from './services/agent-graph-factory.service';
import { LangGraphService } from './services/lang-graph.service';
import { AgentPort } from '../ports/agent.port';

@Module({
  imports: [
    forwardRef(() => MissionModule),
    forwardRef(() => AiModule),
  ],
  providers: [
    AgentNodesService,
    AgentPromptsService,
    AgentGraphFactoryService,
    { provide: AgentPort, useClass: LangGraphService },
  ],
  exports: [AgentPort],
})
export class AgentModule {}
