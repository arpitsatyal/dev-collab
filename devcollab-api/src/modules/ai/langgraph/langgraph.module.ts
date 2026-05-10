import { Module } from '@nestjs/common';
import { AiCoreModule } from '../ai-core.module';
import { ToolsModule } from '../tools/tools.module';
import { AgentModule } from '../agent/agent.module';
import { GraphNodesService } from './services/graph-nodes.service';
import { GraphFactoryService } from './services/graph-factory.service';
import { GraphPersistenceService } from './services/graph-persistence.service';
import { LangGraphService } from './services/langgraph.service';
import { AgentOrchestrator, AgentPort } from '../agent/ports/agent.port';
import { AgentService } from '../agent/services/agent.service';

@Module({
  imports: [AiCoreModule, ToolsModule, AgentModule],
  providers: [
    GraphNodesService,
    GraphFactoryService,
    GraphPersistenceService,
    { provide: AgentOrchestrator, useClass: LangGraphService },
    { provide: AgentPort, useClass: AgentService },
  ],
  exports: [AgentPort],
})
export class LangGraphModule { }
