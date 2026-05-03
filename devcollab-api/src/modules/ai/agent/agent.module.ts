import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core.module';
import { AgentNodesService } from './services/agent-nodes.service';
import { AgentGraphFactoryService } from './services/agent-graph-factory.service';
import { LangGraphService } from './services/lang-graph.service';
import { AgentPort } from './ports/agent.port';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [AiCoreModule, ToolsModule],
  providers: [
    AgentNodesService,
    AgentGraphFactoryService,
    { provide: AgentPort, useClass: LangGraphService },
  ],
  exports: [AgentPort],
})
export class AgentModule { }
