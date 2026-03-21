
import { getSpeedyLLM, getSpeedyStructuredLLM } from "../llmFactory";
import prisma from "../../db/prisma";
import { BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { buildChatMessages, buildIntentClassificationPrompt, buildConversationalMessages, IntentSchema } from "./promptService";
import { runAgentGraph } from "./langGraphService";

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

// ── Path A: Tool-calling loop (workspace-scoped chat via LangGraph) ──────────────
async function getAIResponseWithTools(chatId: string, question: string, workspaceId: string) {
    const history = await getChatHistory(chatId);
    const initialMessages: BaseMessage[] = buildChatMessages(history, question);
    const answer = await runAgentGraph(initialMessages, workspaceId);
    return { answer, context: "", validated: { isValid: true, warning: null } };
}

// ── Public entrypoint ─────────────────────────────────────────────────────────
export async function getAIResponse(chatId: string, question: string, filters?: Record<string, any>) {
    // 1. Intent Classification
    // Use SPEEDY model for intent to reduce latency.
    const classifierLlm = await getSpeedyStructuredLLM(IntentSchema, "classify_intent");
    const intentMessages = buildIntentClassificationPrompt(question);

    let intent = "WORKSPACE_QUERY";

    try {
        const result = await classifierLlm.invoke(intentMessages);
        if (result.confidence > 0.4) {
            intent = result.intent;
        } else {
            console.warn("[Chat Engine] Intent classification low confidence, defaulting to WORKSPACE_QUERY");
        }
    } catch (e) {
        console.warn("[Chat Engine] Intent classification failed:", e);
    }

    console.log(`[Chat Engine] Intent: ${intent} | Question: "${question.substring(0, 50)}..."`);

    // 2. Direct Conversational Response
    if (intent === "CONVERSATIONAL") {
        console.log("[Chat Engine] Path: Conversational LLM");
        const history = await getChatHistory(chatId);
        const conversationalMessages = buildConversationalMessages(history, question);
        // Conversational responses should be fast: use SPEEDY
        const conversationalLlm = await getSpeedyLLM();
        const answer = await conversationalLlm.pipe(new StringOutputParser()).invoke(conversationalMessages);
        return { answer, context: "", validated: { isValid: true, warning: null } };
    }

    const effectiveWorkspaceId = filters?.workspaceId || "";
    console.log(`[Chat Engine] Path: Agent Graph | Context: ${effectiveWorkspaceId ? `Workspace (${effectiveWorkspaceId})` : "Global"}`);
    return getAIResponseWithTools(chatId, question, effectiveWorkspaceId);
}
