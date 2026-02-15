import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getAIResponse } from "../../../lib/ai/aiService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const chatId = req.query.chatId as string;
  if (!chatId) {
    return res.status(400).json({ error: "Chat Id is required." });
  }

  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing question" });
  }

  try {
    // Save user message
    await prisma.message.create({
      data: {
        chatId,
        content: question,
        isUser: true,
      },
    });

    // Get AI response from service
    const { answer } = await getAIResponse(chatId, question);

    // Save AI message
    await prisma.message.create({
      data: {
        chatId,
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
