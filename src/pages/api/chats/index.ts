import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export interface ChatCreateData {
  senderId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        if (req.query.chatId) {
          const chat = await prisma.chat.findUnique({
            where: {
              id: req.query.chatId as string,
            },
            include: { messages: true },
          });
          return res.status(200).json(chat);
        }

        const chats = await prisma.chat.findMany({
          orderBy: { updatedAt: "desc" },
          include: { messages: true },
        });
        return res.status(200).json(chats);
      } catch (error) {
        console.error("Error fetching chat:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const chat = await prisma.chat.create({
          data: {
            senderId: session.user.id,
          },
        });

        return res.status(201).json(chat);
      } catch (error) {
        console.error("Error creating a new chat:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "DELETE":
      try {
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Chat ID is required" });
        }

        await prisma.chat.delete({
          where: {
            id,
          },
        });

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error deleting chat:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PATCH"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
