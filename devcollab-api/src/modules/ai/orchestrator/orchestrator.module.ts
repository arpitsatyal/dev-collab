import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { GraphNodesService } from './services/graph-nodes.service';
import { GraphFactoryService } from './services/graph-factory.service';
import { GraphPersistenceService } from './services/graph-persistence.service';
import { LangGraphAdapter } from './adapters/langgraph.adapter';
import { AgentOrchestrator, AgentPort } from '../agent/ports/agent.port';
import { AgentService } from '../agent/services/agent.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [ToolsModule, LlmModule],
  providers: [
    GraphNodesService,
    GraphFactoryService,
    GraphPersistenceService,
    { provide: AgentOrchestrator, useClass: LangGraphAdapter },
    { provide: AgentPort, useClass: AgentService },
  ],
  exports: [AgentPort],
})
export class OrchestratorModule { }
