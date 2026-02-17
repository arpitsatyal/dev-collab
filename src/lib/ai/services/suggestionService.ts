
import { getLLMWithFallback } from "../llmFactory";
import prisma from "../../db/prisma";

export interface WorkItemSuggestion {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    category: string;
}

export async function suggestWorkItems(projectId: string): Promise<WorkItemSuggestion[]> {
    const llm = await getLLMWithFallback();

    // 1. Fetch context (Snippets, Docs, and Existing Tasks)
    const [snippets, docs, existingTasks] = await Promise.all([
        prisma.snippet.findMany({
            where: { projectId },
            take: 5, // Reduced from 10 to avoid context bloat/truncation
            orderBy: { updatedAt: "desc" },
            select: { title: true, content: true, language: true }
        }),
        prisma.doc.findMany({
            where: { projectId },
            take: 3, // Reduced from 5
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        }),
        prisma.task.findMany({
            where: { projectId },
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { title: true }
        })
    ]);

    if (snippets.length === 0 && docs.length === 0) {
        return [];
    }

    const safeParseContent = (content: any): string => {
        if (typeof content !== 'string') return JSON.stringify(content);
        try {
            const parsed = JSON.parse(content);
            return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch (e) {
            return content;
        }
    };

    const contextStr = [
        ...snippets.map(s => {
            const contentString = safeParseContent(s.content);
            return `Snippet: ${s.title} (${s.language})\nContent: ${contentString.slice(0, 400)}...`;
        }),
        ...docs.map(d => `Document: ${d.label}\nSummary: ${JSON.stringify(d.content).slice(0, 400)}...`)
    ].join("\n\n");

    const existingTasksStr = existingTasks.map(t => `- ${t.title}`).join("\n");

    // 2. Construct Suggestion Prompt
    const prompt = `You are a Senior Project Manager and Technical Architect.
Based on the following code context and documentation from a workspace, suggest 3 high-value "Work Items" (tasks) that should be tackled next.

EXISTING WORK ITEMS (DO NOT SUGGEST THESE OR SIMILAR TASKS):
${existingTasksStr || "No work items created yet."}

Focus on:
1. Technical Debt or Refactoring.
2. Feature Gaps or missing edge cases.
3. Documentation or Security.

CONTEXT:
${contextStr}

RESPONSE FORMAT:
Return ONLY a JSON array of 3 objects. Each object MUST have:
- "title": Concise title.
- "description": Clear explanation (DO NOT USE NEWLINES INSIDE THE JSON DESCRIPTION STRING).
- "priority": "LOW", "MEDIUM", or "HIGH".
- "category": Short category (e.g., "Refactor", "Feature").

Do NOT include any markdown formatting or text besides the JSON array.`;

    try {
        const response = await llm.invoke(prompt);
        let content = response["lc_kwargs"].content as string;

        // More robust JSON extraction and cleaning
        // 1. Remove markdown backticks
        content = content.replace(/```json|```/g, "").trim();

        // 2. Locate the JSON array
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        let jsonStr = jsonMatch ? jsonMatch[0] : content;

        // 3. CRITICAL: Handle unescaped newlines in JSON strings which LLMs often generate
        // Replace literal newlines within quotes with \n
        jsonStr = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
            return '"' + p1.replace(/\n/g, "\\n") + '"';
        });

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Suggestion Engine] JSON Parse Error. Cleaned Content was:", jsonStr);
            return [];
        }
    } catch (error) {
        console.error("[Suggestion Engine] Error generating suggestions:", error);
        return [];
    }
}

export async function generateImplementationPlan(taskId: string): Promise<string> {
    const llm = await getLLMWithFallback();

    // 1. Fetch Task and linked context
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            snippets: true,
            project: true
        }
    });

    if (!task) throw new Error("Work Item not found");

    const contextStr = task.snippets.map(s =>
        `--- Snippet: ${s.title} (${s.language}) ---\n${s.content}`
    ).join("\n\n");

    // 2. Construct Analysis Prompt
    const prompt = `You are a Senior Software Engineer and Mentor.
Goal: Generate a technical implementation plan for the following Work Item.

Work Item: "${task.title}"
Description: ${task.description || "No description provided."}

The user has attached the following code context:
${contextStr || "No code context attached."}

INSTRUCTIONS:
1. RESTRICTION: Use ONLY the provided code context. Do not invent external libraries unless they are obvious standards.
2. FORMAT: Provide a structured Markdown plan.
3. INCLUDE:
   - High-level approach.
   - Step-by-step code changes (use diff-style or clear snippets).
   - Potential edge cases or risks.

Tone: Professional, concise, and helpful.`;

    try {
        const response = await llm.invoke(prompt);
        return response["lc_kwargs"].content as string;
    } catch (error) {
        console.error("[Analysis Engine] Error generating plan:", error);
        return "Failed to generate implementation plan. Please try again.";
    }
}

