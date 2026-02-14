import type { NextApiRequest, NextApiResponse } from "next";
import { TogetherLLM } from "../../../lib/togetherLLM";
import { getVectorStore } from "../../../lib/vectorStore";
import prisma from "../../../lib/prisma";

// Cache the vector store promise to avoid recreating it on every request if possible
// However, getVectorStore creates new Pinecone client each time which might be fine for serverless
// but let's cache the promise if we want. 
// For now, let's just call it directly to avoid stale client issues.

export interface CreateMessageData {
  content: string;
  isUser: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.query.chatId) {
    return res.status(400).json({ error: "Chat Id is required." });
  }

  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing question" });
  }

  await prisma.message.create({
    data: {
      chatId: req.query.chatId as string,
      content: question,
      isUser: true,
    },
  });

  try {
    const vectorStore = await getVectorStore();
    const results = await vectorStore.similaritySearch(question, 3);
    const context = results.map((r) => r.pageContent).join("\n");

    const llm = new TogetherLLM({});

    const pastMessages = await prisma.message.findMany({
      where: { chatId: req.query.chatId as string },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    const history = pastMessages
      .map((m) => (m.isUser ? `User: ${m.content}` : `AI: ${m.content}`))
      .join("\n");

    const fullPrompt = `
You are a helpful and concise assistant for a web app called Dev-Collab.
Use the context below and the conversation history to answer naturally.
Do not say "based on the context" or "in the given context".
Just give a clear, helpful answer.

Conversation so far:
${history}

Context:
${context}

User's Question:
${question}

Answer:`.trim();

    const aiResponse = await llm.invoke(fullPrompt);
    const answer = aiResponse["lc_kwargs"].content;

    await prisma.message.create({
      data: {
        chatId: req.query.chatId as string,
        content: answer,
        isUser: false,
      },
    });

    res.status(200).json({ answer });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
