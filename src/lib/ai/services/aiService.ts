
import { getReasoningLLM, getSpeedyLLM, getReasoningToolBoundLLM, getReasoningStructuredLLM } from "../llmFactory";
import prisma from "../../db/prisma";
import { ToolMessage, AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getSnippetsTool, getDocsTool, getExistingTasksTool, semanticSearchTool } from "./toolService";
import { performHybridSearch, generateQueryVariations } from "./retrievalService";
import { constructPrompt, buildChatMessages, buildIntentClassificationPrompt, buildConversationalMessages, IntentSchema } from "./promptService";
import { generateAnswer } from "./generationService";

const MAX_CHAT_ITERATIONS = 5;

async function getChatHistory(chatId: string): Promise<string> {
    const pastMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
    });
    return pastMessages
        .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
        .join("\n");
}

// ── Path A: Tool-calling loop (project-scoped chat) ───────────────────────────
async function getAIResponseWithTools(chatId: string, question: string, projectId: string) {
    const tools = [getSnippetsTool, getDocsTool, getExistingTasksTool, semanticSearchTool];
    const toolsByName: Record<string, { invoke: (args: any) => Promise<any> }> = Object.fromEntries(tools.map(t => [t.name, t]));

    const llmWithTools = await getReasoningToolBoundLLM(tools);
    const history = await getChatHistory(chatId);
    const calledTools: string[] = [];

    let messages: BaseMessage[] = buildChatMessages(history, question);

    let iterations = 0;
    while (iterations < MAX_CHAT_ITERATIONS) {
        iterations++;
        const response = await llmWithTools.invoke(messages) as AIMessage;
        messages = [...messages, response];

        if (!response.tool_calls || response.tool_calls.length === 0) break;

        for (const toolCall of response.tool_calls) {
            calledTools.push(toolCall.name);
            const tool = toolsByName[toolCall.name];
            if (!tool) {
                messages = [...messages, new ToolMessage({
                    content: `Error: Tool ${toolCall.name} not found.`,
                    tool_call_id: toolCall.id!,
                })];
                continue;
            }
            const result = await tool.invoke({ ...toolCall.args, projectId });
            messages = [...messages, new ToolMessage({
                content: result,
                tool_call_id: toolCall.id!,
            })];
        }
    }

    if (calledTools.length === 0) {
        console.log("[Chat Engine] LLM answered directly (no tools called).");
    } else {
        console.log(`[Chat Engine] Tools called (${calledTools.length}): ${calledTools.join(" → ")}`);
    }

    // Append a final instruction so the LLM always has an open question to answer
    messages = [...messages, new HumanMessage("Please provide your final answer to the user's question based on the information gathered.")];
    // Final answer generation should be fast
    const llm = await getSpeedyLLM();
    const answer = await llm.pipe(new StringOutputParser()).invoke(messages);
    return { answer, context: "", validated: { isValid: true, warning: null } };
}

// ── Path B: Hybrid vector search fallback (global / no project) ───────────────
async function getAIResponseWithSearch(chatId: string, question: string, filters?: Record<string, any>) {
    // Query generation for search needs to be accurate: use REASONING
    const queryGenLlm = await getReasoningLLM();

    const queries = await generateQueryVariations(question, queryGenLlm);
    const filteredResults = await performHybridSearch(queries, question, filters);

    filteredResults.forEach(([doc, score]: any, i: number) => {
        console.log(`Result ${i + 1}: Score: ${score.toFixed(4)}, Type: ${doc.metadata?.type}, Title: ${doc.metadata?.projectTitle}`);
    });

    const context = filteredResults.length > 0
        ? filteredResults.map(([doc]: any) => {
            const type = doc.metadata?.type || "General Info";
            const title = doc.metadata?.projectTitle || "Unknown Project";
            return `--- Source: Information from ${type} within project "${title}" ---\n${doc.pageContent}`;
        }).join("\n\n")
        : "I don't have enough specific information in my records to answer this fully.";

    const history = await getChatHistory(chatId);
    const fullPrompt = constructPrompt(context, history, question);
    // Generate final answer using SPEED model (generateAnswer is just summarizing)
    const answerLlm = await getSpeedyLLM();
    return await generateAnswer(answerLlm, fullPrompt, context, filteredResults);
}

// ── Public entrypoint ─────────────────────────────────────────────────────────
export async function getAIResponse(chatId: string, question: string, filters?: Record<string, any>) {
    // 1. Intent Classification
    // Intent Classification needs reliable JSON: use REASONING
    const classifierLlm = await getReasoningStructuredLLM(IntentSchema, "classify_intent");
    const intentMessages = buildIntentClassificationPrompt(question);

    let intent = "PROJECT_QUERY";

    try {
        const result = await classifierLlm.invoke(intentMessages);
        if (result.confidence > 0.4) {
            intent = result.intent;
        } else {
            console.warn("[Intent Classification] Low confidence, defaulting to PROJECT_QUERY");
        }
    } catch (e) {
        console.warn("[Intent Classification] Failed, defaulting to PROJECT_QUERY:", e);
    }

    // 2. Direct Conversational Response
    if (intent === "CONVERSATIONAL") {
        console.log("[Chat Engine] Intent classified as CONVERSATIONAL. Skipping tools/search.");
        const history = await getChatHistory(chatId);
        const conversationalMessages = buildConversationalMessages(history, question);
        // Conversational responses should be fast: use SPEEDY
        const conversationalLlm = await getSpeedyLLM();
        const answer = await conversationalLlm.pipe(new StringOutputParser()).invoke(conversationalMessages);
        return { answer, context: "", validated: { isValid: true, warning: null } };
    }

    // 3. Project Query Routing
    if (filters?.projectId) {
        return getAIResponseWithTools(chatId, question, filters.projectId);
    }
    return getAIResponseWithSearch(chatId, question, filters);
}
