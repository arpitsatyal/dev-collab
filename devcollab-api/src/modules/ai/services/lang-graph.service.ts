import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage, ToolMessage, SystemMessage } from '@langchain/core/messages';
import {
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { MissionService } from '../../mission/mission.service';
import { AiConfig } from '../ai.config';
import { LlmGateway } from '../ports/llm.port';
import { ToolRegistry } from '../ports/tool.port';
import { AgentPort } from '../ports/agent.port';
import { IAiResult } from '../interfaces';

@Injectable()
export class LangGraphService implements AgentPort {
  private readonly logger = new Logger(LangGraphService.name);

  constructor(
    private readonly llmGateway: LlmGateway,
    private readonly toolService: ToolRegistry,
    private readonly config: AiConfig,
    private readonly missionService: MissionService,
  ) {}

  private readonly checkpointer = new MemorySaver();

  /**
   * Runs a LangGraph loop that alternates between the LLM (agent) and tools
   * until the model stops requesting tools. Workspace context is provided
   * via `configurable.workspaceId`, which LangGraph forwards to each tool.
   */
  async runAgentGraph(
    messages: BaseMessage[],
    workspaceId: string,
    missionId?: string,
  ): Promise<IAiResult> {
    const { list: tools } = this.toolService.getToolsForWorkspace(workspaceId);
    const llmWithTools = await this.llmGateway.getReasoningToolBoundLLM(tools);

    const callModel = async (
      state: typeof MessagesAnnotation.State,
    ): Promise<{ messages: BaseMessage[] }> => {
      if (missionId) {
        await this.missionService.pushLog(missionId, 'AI is reasoning...');
      }
      const response = await llmWithTools.invoke(state.messages);
      return { messages: [response] };
    };

    const toolNode = new ToolNode(tools);

    const callToolsNode = async (
      state: typeof MessagesAnnotation.State,
    ): Promise<{ messages: BaseMessage[] }> => {
      if (missionId) {
        const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
        const toolCalls = lastMsg.tool_calls || [];
        
        // Track each tool call as a mission step
        const stepIds: string[] = [];
        for (const tc of toolCalls) {
          const step = await this.missionService.addStep(missionId, `Tool: ${tc.name}`, 'RUNNING');
          await this.missionService.pushLog(missionId, `Agent executing tool: ${tc.name}`, step.id);
          stepIds.push(step.id);
        }

        // Execute all tools in the state
        const result = (await toolNode.invoke(state)) as { messages: ToolMessage[] };
        
        // Log the raw result for debugging
        this.logger.log(`Tool Result for ${toolCalls.map(tc => tc.name).join(', ')}: ${JSON.stringify(result.messages.map(m => m.content))}`);

        // Mark all related mission steps as complete
        for (const sid of stepIds) {
          await this.missionService.updateStepStatus(sid, missionId, 'COMPLETED');
        }

        return result;
      }
      return toolNode.invoke(state) as any;
    };

    const app = new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addNode('tools', callToolsNode)
      .addEdge('__start__', 'agent')
      .addConditionalEdges(
        'agent',
        (state: typeof MessagesAnnotation.State) => {
          const lastMessage = state.messages[
            state.messages.length - 1
          ] as AIMessage;
          return lastMessage.tool_calls?.length ? 'tools' : '__end__';
        },
      )
      .addEdge('tools', 'agent')
      .compile({
        checkpointer: this.checkpointer,
      });

    const thread_id = missionId || workspaceId;

    // Inject steering prompt for missions if not present
    let initialMessages = messages;
    if (missionId && !messages.some((m) => m instanceof SystemMessage)) {
      const steeringPrompt = new SystemMessage(
        `You are a Mission Control Agent with ROOT/ADMINISTRATOR permissions. Your goal is to autonomously complete the user's task within the workspace (ID: ${workspaceId}).
        
        RULES:
        1. ALWAYS use your tools to explore and act. You have UNRESTRICTED access to all tools.
        2. DO NOT guess or assume information—retrive it first.
        3. Break down complex tasks into logical steps.
        4. If a tool reports "Successfully created/updated", DO NOT enter a loop to verify it again unless specifically asked. Move immediately to your final summary.
        5. CROSS-WORKSPACE MISSIONS: If the user mentions a specific workspace by name, FIRST use the "searchWorkspaces" tool to find its ID. Then, provide that "workspaceId" to any subsequent tool calls.
        6. When you are finished, summarize your accomplishments clearly.`,
      );
      initialMessages = [steeringPrompt, ...messages];
    }

    const finalState = await app.invoke(
      { messages: initialMessages },
      {
        recursionLimit: this.config.maxIterations,
        configurable: { workspaceId, thread_id },
      },
    );

    // No additional logging needed here as tools and reasoning are logged during execution

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
      .find((m: BaseMessage) => m instanceof AIMessage) as
      | AIMessage
      | undefined;

    const answer =
      typeof lastAIMessage?.content === 'string'
        ? lastAIMessage.content
        : JSON.stringify(
            lastAIMessage?.content ?? 'Unable to generate a response.',
          );

    return { answer, calledTools };
  }
}
