import { Injectable, Logger } from '@nestjs/common';
import {
  BaseMessage,
} from '@langchain/core/messages';
import { AiConfig } from 'src/modules/ai/ai.config';
import { LlmGateway } from 'src/modules/ai/llms/ports/llm.port';
import { ToolRegistry } from 'src/modules/ai/tools/ports/tools.port';
import { AgentPort } from '../ports/agent.port';
import { AgentGraphFactoryService } from './agent-graph-factory.service';
import { IAiResult } from 'src/modules/ai/interfaces';
import { AgentRunOptions } from '../interfaces/agent.interfaces';
import { AgentStateUtils } from '../utils/agent-state.utils';

@Injectable()
export class LangGraphService implements AgentPort {
  private readonly logger = new Logger(LangGraphService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly toolService: ToolRegistry,
    private readonly config: AiConfig,
    private readonly graphFactory: AgentGraphFactoryService,
  ) { }

  /**
   * Orchestrates the agentic mission execution.
   */
  async runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    options: AgentRunOptions,
  ): Promise<IAiResult> {
    // 1. Prepare Tools and LLM
    const tools = await this.toolService.getTools(workspaceId);
    const llmWithTools = await this.llmGateway.getReasoningToolBoundLLM(tools);

    // 2. Build the Graph
    const app = this.graphFactory.createGraph(llmWithTools, tools);

    // 3. Invoke the Graph
    const thread_id = options.threadId || workspaceId;
    const config = {
      recursionLimit: this.config.maxIterations,
      configurable: {
        workspaceId,
        thread_id,
        ...options.configurable,
      },
    };

    // If we have messages, we start/update the state. 
    // If not, we pass null to continue from the last checkpoint (useful for simple approval).
    const input = messages.length > 0 ? { messages } : null;
    const finalState = await app.invoke(input, config);

    // 4. Detect Interrupts
    const state = await app.getState(config);
    
    if (state.next && state.next.length > 0) {
      const isPeriodicPause = state.next.includes('pause');
      this.logger.log(`Mission ${thread_id} interrupted for ${isPeriodicPause ? 'periodic check-in' : 'human approval'} (Next nodes: ${state.next.join(', ')})`);
      
      // We must map the final state to get the actual message from the agent about what tools it plans to use.
      // This ensures we pass the "I plan to use..." text back to the frontend.
      const interimResult = this.mapFinalStateToResult(state.values);

      return {
        answer: isPeriodicPause 
          ? `I've reached iteration ${state.values.iterationCount}. Just checking in before I continue my reasoning.` 
          : interimResult.answer, // Use the extracted answer containing the planned tools
        calledTools: [],
        interrupted: true,
      };
    }

    // 5. Parse and Return Results
    return this.mapFinalStateToResult(finalState);
  }

  /**
   * Maps the final LangGraph state to the standard IAiResult format.
   */
  private mapFinalStateToResult(finalState: any): IAiResult {
    const messages = finalState.messages as BaseMessage[];

    const calledTools = AgentStateUtils.getToolSequence(messages);

    if (calledTools.length === 0) {
      this.logger.log('Response: Direct LLM (no tools used)');
    }
    this.logger.log(`Response: Tool Sequence [${calledTools.join(' -> ')}]`);

    const lastAIMessage = AgentStateUtils.getLastAIMessage(messages);
    const answer = AgentStateUtils.getContent(lastAIMessage);

    return { answer, calledTools };
  }
}
