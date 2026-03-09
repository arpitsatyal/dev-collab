import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getReasoningToolBoundLLM } from "../llmFactory";
import { getSnippetsTool, getDocsTool, getExistingTasksTool, semanticSearchTool } from "./toolService";

/**
 * Runs the LangGraph agent loop for project-scoped queries.
 * The graph cycles between an agent node (LLM reasoning) and a tools node
 * (executing tool calls) until the LLM stops requesting tools.
 *
 * projectId is passed via `configurable` and automatically threaded
 * into each tool's third `config` argument by LangGraph.
 */
export async function runAgentGraph(
    messages: BaseMessage[],
    projectId: string
): Promise<string> {
    const tools = [getSnippetsTool, getDocsTool, getExistingTasksTool, semanticSearchTool];
    const llmWithTools = await getReasoningToolBoundLLM(tools);

    // ── Nodes ──────────────────────────────────────────────────────────────────
    const callModel = async (state: typeof MessagesAnnotation.State): Promise<{ messages: BaseMessage[] }> => {
        const response = await llmWithTools.invoke(state.messages);
        return { messages: [response] };
    };

    const toolNode = new ToolNode(tools);

    // ── Graph ──────────────────────────────────────────────────────────────────
    const app = new StateGraph(MessagesAnnotation)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", (state: typeof MessagesAnnotation.State) => {
            const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
            return lastMessage.tool_calls?.length ? "tools" : "__end__";
        })
        .addEdge("tools", "agent")
        .compile();

    // ── Execution ──────────────────────────────────────────────────────────────
    console.log(`[LangGraph] Starting Agent Graph | Context: ${projectId || "Global"}`);

    // projectId flows into each tool via config?.configurable?.projectId
    const finalState = await app.invoke(
        { messages },
        { recursionLimit: 10, configurable: { projectId } }
    );

    const calledTools = finalState.messages
        .filter((m: BaseMessage) => m instanceof ToolMessage)
        .map((m: ToolMessage) => m.name);

    if (calledTools.length === 0) {
        console.log("[LangGraph] Response: Direct LLM (no tools used)");
    } else {
        console.log(`[LangGraph] Response: Tool Sequence [${calledTools.join(" → ")}]`);
    }

    // The last AIMessage already contains the final reasoned answer after seeing tool output.
    // A second synthesis LLM call risks hallucinating counts/details, so we use it directly.
    const lastAIMessage = [...finalState.messages]
        .reverse()
        .find((m: BaseMessage) => m instanceof AIMessage) as AIMessage | undefined;

    return typeof lastAIMessage?.content === "string"
        ? lastAIMessage.content
        : JSON.stringify(lastAIMessage?.content ?? "Unable to generate a response.");
}
