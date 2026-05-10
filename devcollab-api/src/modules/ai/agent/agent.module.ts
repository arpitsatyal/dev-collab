import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core.module';
import { AgentNodesService } from './services/agent-nodes.service';
import { AgentGraphFactoryService } from './services/agent-graph-factory.service';
import { LangGraphService } from './services/lang-graph.service';
import { AgentPort } from './ports/agent.port';
import { ToolsModule } from '../tools/tools.module';
import { GraphPersistenceService } from './services/graph-persistence.service';

@Module({
  imports: [AiCoreModule, ToolsModule],
  providers: [
    AgentNodesService,
    AgentGraphFactoryService,
    GraphPersistenceService,
    { provide: AgentPort, useClass: LangGraphService },
  ],
  exports: [AgentPort],
})
export class AgentModule { }
