import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core.module';
import { AgentNodesService } from './services/agent-nodes.service';
import { AgentPromptsService } from './services/agent-prompts.service';
import { AgentGraphFactoryService } from './services/agent-graph-factory.service';
import { LangGraphService } from './services/lang-graph.service';
import { AgentPort } from '../ports/agent.port';
import { AiToolsModule } from '../ai-tools.module';

@Module({
  imports: [
    AiCoreModule,
    AiToolsModule,
  ],
  providers: [
    AgentNodesService,
    AgentPromptsService,
    AgentGraphFactoryService,
    { provide: AgentPort, useClass: LangGraphService },
  ],
  exports: [AgentPort],
})
export class AgentModule { }
