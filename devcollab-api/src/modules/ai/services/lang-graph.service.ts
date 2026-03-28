import { Injectable, Logger } from '@nestjs/common';
import {
  AIMessage,
  BaseMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { MessagesAnnotation, StateGraph } from '@langchain/langgraph';
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AiConfig } from '../ai.config';
import { LlmGateway } from '../ports/llm.port';
import { ToolRegistry } from '../ports/tool.port';
import { AgentPort } from '../ports/agent.port';

@Injectable()
export class LangGraphService implements AgentPort {
  private readonly logger = new Logger(LangGraphService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly toolService: ToolRegistry,
    private readonly config: AiConfig,
  ) { }

  /**
   * Runs a LangGraph loop that alternates between the LLM (agent) and tools
   * until the model stops requesting tools. Workspace context is provided
   * via `configurable.workspaceId`, which LangGraph forwards to each tool.
   */
  async runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
  ): Promise<{ answer: string; calledTools: string[] }> {
    const { list: tools } = this.toolService.getToolsForWorkspace(workspaceId);
    const llmWithTools = await this.llmGateway.getReasoningToolBoundLLM(tools);

    const callModel = async (
      state: typeof MessagesAnnotation.State,
    ): Promise<{ messages: BaseMessage[] }> => {
      const response = await llmWithTools.invoke(state.messages);
      return { messages: [response] };
    };

    const toolNode = new ToolNode(tools);

    const app = new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addNode('tools', toolNode)
      .addEdge('__start__', 'agent')
      .addConditionalEdges('agent', (state: typeof MessagesAnnotation.State) => {
        const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
        return lastMessage.tool_calls?.length ? 'tools' : '__end__';
      })
      .addEdge('tools', 'agent')
      .compile();

    const finalState = await app.invoke(
      { messages },
      {
        recursionLimit: this.config.maxIterations,
        configurable: { workspaceId },
      },
    );

    const calledTools = finalState.messages
      .filter((m: BaseMessage) => m instanceof ToolMessage)
      .map((m: ToolMessage) => m.name)
      .filter(Boolean) as string[];

    if (calledTools.length === 0) {
      this.logger.log('Response: Direct LLM (no tools used)');
    } else {
      this.logger.log(`Response: Tool Sequence [${calledTools.join(' -> ')}]`);
    }

    const lastAIMessage = [...finalState.messages]
      .reverse()
      .find((m: BaseMessage) => m instanceof AIMessage) as AIMessage | undefined;

    const answer =
      typeof lastAIMessage?.content === 'string'
        ? lastAIMessage.content
        : JSON.stringify(lastAIMessage?.content ?? 'Unable to generate a response.');

    return { answer, calledTools };
  }
}
