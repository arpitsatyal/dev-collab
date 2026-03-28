import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { PromptPort } from '../ports/prompt.port';

@Injectable()
export class PromptService implements PromptPort {
  constructPrompt(context: string, history: string, question: string) {
    return ChatPromptTemplate.fromTemplate(
      `
You are DevCollab Assistant, a friendly and insightful companion for developers. Your goal is to help the user navigate their workspace with a warm and collaborative tone. 

Always provide accurate information grounded in the provided context, but present it naturally—like a knowledgeable teammate rather than a robot. Avoid listing statistics dryly; instead, weave them into a helpful narrative.

Context from the workspace:
{context}

Recent conversation:
{history}

User question:
{question}

If the information isn't in the context, politely let the user know and suggest what they might add to the workspace to help you answer better.
  `.trim(),
    ).format({
      context,
      history,
      question,
    });
  }

  buildChatMessages(history: string, question: string, workspaceId?: string) {
    let sysMsg = 'You are DevCollab Assistant, a helpful and enthusiastic teammate. Your tone should be friendly, professional, and natural. Avoid being robotic or purely formulaic.';
    if (workspaceId) {
      sysMsg += `\n\n[MANDATORY STEP]: The user is currently in a workspace (ID: ${workspaceId}). For general questions like "what is this about?", "summarize the workspace", or "give me an overview", you MUST call the "getWorkspaceOverview" tool. \n\n[TONE GUIDELINE]: When summarizing tools results, don't just list counts (e.g., "5 snippets, 0 docs"). Instead, be descriptive and friendly. Talk about the project's purpose based on its title and description, and mention what's available or what's missing in a conversational way (e.g., "It looks like we're just getting started with the documentation!" or "I found some interesting code snippets for your project."). YOU ARE FORBIDDEN from guessing or using general knowledge—always use your tools first.`;
    }

    return [
      new SystemMessage(sysMsg),
      new HumanMessage(
        `Conversation history:\n${history}\n\nUser question: ${question}`,
      ),
    ];
  }

  buildIntentClassificationPrompt(question: string, inWorkspace?: boolean) {
    let sysMsg = 'Classify the user intent. Decide if the user asks about DevCollab workspace data (WORKSPACE_QUERY) or is just casual chat (CONVERSATIONAL). Determine scope: APP_SPECIFIC if it clearly refers to app data, OUT_OF_SCOPE otherwise. Return JSON with fields intent, scope, confidence (0-1).';
    if (inWorkspace) {
      sysMsg += ' NOTE: The user is currently inside a workspace. Ambiguous references like "this", "it", "here", or "this page" MUST be classified as WORKSPACE_QUERY and APP_SPECIFIC because they refer to the active workspace.';
    }
    return [
      new SystemMessage(sysMsg),
      new HumanMessage(question),
    ];
  }

  buildConversationalMessages(history: string, question: string, isOutOfScope?: boolean) {
    let userMessage = `Conversation history:\n${history}\n\nUser question: ${question}`;
    if (isOutOfScope) {
      userMessage += `\n\n[CRITICAL DIRECTIVE]: This query is OUT OF SCOPE. Politely and warmly explain that you're a specialized DevCollab workspace assistant and can't assist with this specific request. Suggest how you *could* help within the context of their workspace instead. DO NOT write stories, poems, or answer general knowledge questions. Stay focused but friendly.`;
    }

    return [
      new SystemMessage(
        'You are DevCollab Assistant, a friendly and helpful teammate. You specialize in DevCollab and the user\'s workspace. If a user asks for something unrelated to their work or the platform, warmly remind them of your focus and suggest how you can help them with their project instead. Avoid being overly formal or robotic.',
      ),
      new HumanMessage(userMessage),
    ];
  }
}
