
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

    // 1. Fetch context (Snippets, Docs, Existing Tasks, and Project Details)
    const [snippets, docs, existingTasks, project] = await Promise.all([
        prisma.snippet.findMany({
            where: { projectId },
            take: 5,
            orderBy: { updatedAt: "desc" },
            select: { title: true, content: true, language: true }
        }),
        prisma.doc.findMany({
            where: { projectId },
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: { label: true, content: true }
        }),
        prisma.task.findMany({
            where: { projectId },
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { title: true }
        }),
        prisma.project.findUnique({
            where: { id: projectId },
            select: { title: true, description: true }
        })
    ]);

    const safeParseContent = (content: any): string => {
        if (typeof content !== 'string') return JSON.stringify(content);
        try {
            const parsed = JSON.parse(content);
            return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch (e) {
            return content;
        }
    };

    const projectContext = project
        ? `PROJECT: ${project.title}\nDESCRIPTION: ${project.description || "No description provided."}`
        : "";

    const snippetsDocsContext = [
        ...snippets.map(s => {
            const contentString = safeParseContent(s.content);
            return `Snippet: ${s.title} (${s.language})\nContent: ${contentString.slice(0, 400)}...`;
        }),
        ...docs.map(d => `Document: ${d.label}\nSummary: ${JSON.stringify(d.content).slice(0, 400)}...`)
    ].join("\n\n");

    const contextStr = [projectContext, snippetsDocsContext].filter(Boolean).join("\n\n");
    const existingTasksStr = existingTasks.map(t => `- ${t.title}`).join("\n");

    // 2. Construct Suggestion Prompt
    const prompt = `You are a Senior Project Manager and Technical Architect.
Based on the following workspace context (Project description, code snippets, and documentation), suggest 3 high-value "Work Items" (tasks) that should be tackled next.

EXISTING WORK ITEMS (DO NOT SUGGEST THESE OR SIMILAR TASKS):
${existingTasksStr || "No work items created yet."}

Focus on:
1. Foundational setup or missing core features (especially if the project is new and has little code/docs).
2. Technical Debt or Refactoring.
3. Feature Gaps or missing edge cases.
4. Documentation or Security.

CONTEXT:
${contextStr || "Minimal context available. Please suggest general foundational tasks based on the project goal if provided."}

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

export async function generateDraftChanges(taskId: string): Promise<string> {
    const llm = await getLLMWithFallback();

    // 1. Fetch Task, linked snippets, and project context
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

    const projectContext = task.project
        ? `Project: ${task.project.title}\nDescription: ${task.project.description || "No description"}`
        : "";

    // 2. Construct Drafting Prompt
    const prompt = `You are an Expert Software Implementation Engineer.
Goal: Draft the specific code changes required to implement the following Work Item.

Work Item: "${task.title}"
Description: ${task.description || "No description provided."}

PROJECT CONTEXT:
${projectContext}

CURRENT CODE SNIPPETS (CONTEXT):
${contextStr || "No specific code context attached. Draft based on general best practices for this type of task."}

INSTRUCTIONS:
1. Analyze the work item and the provided code context.
2. Generate a clean, production-ready "Draft Diff" or specific code blocks.
3. If specific snippets are provided, show how they would be modified.
4. If no snippets are provided, draft the new component or utility logic from scratch.
5. Use standard modern coding patterns (e.g., Hooks for React, Prisma for DB, etc.).
6. Focus on the core logic and critical parts of the implementation.

RESPONSE FORMAT:
Provide your response in clear Markdown. 
Start with a brief summary of the changes, then provide the code blocks with clear file names if applicable.
`;

    try {
        const response = await llm.invoke(prompt);
        return response["lc_kwargs"].content as string;
    } catch (error) {
        console.error("[Drafting Engine] Error generating draft:", error);
        return "Failed to generate draft changes. Please try again.";
    }
}

