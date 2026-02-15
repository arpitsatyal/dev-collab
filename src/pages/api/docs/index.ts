import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export interface DocCreateData {
  label: string;
  projectId: string;
  roomId: string;
}

export interface DocUpdateData {
  content: string;
  projectId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { projectId, docId } = req.query;
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  switch (req.method) {
    case "GET":
      try {
        if (docId) {
          const doc = await prisma.doc.findUnique({
            where: { id: docId as string },
          });
          if (!doc) {
            return res.status(404).json({ error: "Doc not found" });
          }
          return res.status(200).json(doc);
        }

        const docs = await prisma.doc.findMany({
          where: { projectId: projectId as string },
        });
        return res.status(200).json(docs);
      } catch (error) {
        console.error("Error fetching docs:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const { label } = req.body as DocCreateData;

        if (!label) {
          return res.status(400).json({ error: "Label is required" });
        }

        const doc = await prisma.doc.create({
          data: {
            label,
            projectId: projectId as string,
            roomId: `docs_${uuidv4()}`,
          },
        });

        return res.status(201).json(doc);
      } catch (error) {
        console.error("Error creating doc:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "PATCH":
      try {
        if (!docId) {
          return res
            .status(400)
            .json({ error: "Doc ID is required for update" });
        }

        const { content } = req.body as DocUpdateData;

        const updateData: Prisma.DocUpdateInput = {
          updatedAt: new Date(),
        };
        if (content) updateData.content = content;

        const updatedDoc = await prisma.doc.update({
          where: { id: docId as string },
          data: updateData,
        });
        return res.status(200).json(updatedDoc);
      } catch (error: any) {
        console.error("Error updating doc:", error);
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Doc not found" });
        }
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PATCH"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
