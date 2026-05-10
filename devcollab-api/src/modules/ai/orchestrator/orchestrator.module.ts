import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { AgentModule } from '../agent/agent.module';
import { GraphNodesService } from './services/graph-nodes.service';
import { GraphFactoryService } from './services/graph-factory.service';
import { GraphPersistenceService } from './services/graph-persistence.service';
import { LangGraphAdapter } from './adapters/langgraph.adapter';
import { AgentOrchestrator, AgentPort } from '../agent/ports/agent.port';
import { AgentService } from '../agent/services/agent.service';
import { LlmGateway } from './llm/llm.types';
import { LangChainLlmFactoryAdapter } from './adapters/llm/langchain-llm-factory.adapter';
import { GroqLlmAdapter } from './adapters/llm/groq-llm.adapter';
import { TogetherLlmAdapter } from './adapters/llm/together-llm.adapter';

@Module({
  imports: [ToolsModule, AgentModule],
  providers: [
    GraphNodesService,
    GraphFactoryService,
    GraphPersistenceService,
    GroqLlmAdapter,
    TogetherLlmAdapter,
    { provide: AgentOrchestrator, useClass: LangGraphAdapter },
    { provide: AgentPort, useClass: AgentService },
    { provide: LlmGateway, useClass: LangChainLlmFactoryAdapter },
  ],
  exports: [AgentPort, LlmGateway],
})
export class OrchestratorModule { }
