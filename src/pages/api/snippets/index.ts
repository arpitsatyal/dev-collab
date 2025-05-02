import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Prisma } from "@prisma/client";

interface SnippetsCreateData {
  title: string;
  language: string;
  content: string;
  authorId: string;
  projectId: string;
  extension?: string;
}

interface SnippetsUpdateData extends SnippetsCreateData {
  lastEditedById: string;
  extension?: string;
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
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const {
    query: { projectId, snippetId },
    method,
  } = req;

  switch (method) {
    case "GET":
      try {
        if (!projectId) {
          return res.status(400).json({ error: "Project ID is required" });
        }

        //single snippet
        if (snippetId) {
          const snippet = await prisma.snippet.findUnique({
            where: {
              id: snippetId as string,
            },
          });

          if (!snippet) {
            return res.status(404).json({ error: "Snippet not found" });
          }

          return res.status(200).json(snippet);
        }

        //snippets for project
        const snippets = await prisma.snippet.findMany({
          where: {
            projectId: projectId as string,
          },
        });

        return res.status(200).json(snippets);
      } catch (error) {
        console.error("Error fetching snippets:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const { title, language, content, extension } =
          req.body as SnippetsCreateData;

        const snippet = await prisma.snippet.create({
          data: {
            title,
            language,
            content,
            extension,
            authorId: user.id,
            projectId: projectId as string,
          },
        });

        return res.status(200).json(snippet);
      } catch (error) {
        console.error("Error creating snippet:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    case "PATCH":
      try {
        const { title, language, content, lastEditedById, extension } =
          (req.body as SnippetsUpdateData) || {};

        const updateData: Prisma.SnippetUpdateInput = {};

        if (title) updateData.title = title;
        if (language) updateData.language = language;
        if (content) updateData.content = content;
        if (extension) updateData.extension = extension;

        const updatedSnippet = await prisma.snippet.update({
          where: {
            id: snippetId as string,
          },
          data: {
            ...updateData,
            lastEditedBy: {
              connect: {
                id: lastEditedById,
              },
            },
          },
        });

        return res.status(200).json(updatedSnippet);
      } catch (error) {
        console.error("Error creating snippet:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
