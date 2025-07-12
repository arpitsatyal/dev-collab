import type { NextApiRequest, NextApiResponse } from "next";
import { TogetherLLM } from "../../../lib/togetherLLM";
import { createVectorStore } from "../../../lib/embedFeatures";
import prisma from "../../../lib/prisma";

let vectorStorePromise: ReturnType<typeof createVectorStore> | null = null;

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
    if (!vectorStorePromise) {
      vectorStorePromise = createVectorStore();
    }

    const vectorStore = await vectorStorePromise;
    const results = await vectorStore.similaritySearch(question, 3);
    const context = results.map((r) => r.pageContent).join("\n");

    const llm = new TogetherLLM({});

    const fullPrompt = `
    You are a helpful and concise assistant for a web app called Dev-Collab.
    Use the context below to answer the user's question directly and naturally.
    Do not say "based on the context" or "in the given context".
    Just give a clear, helpful answer.
    Context: ${context}
    Question: ${question}
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
