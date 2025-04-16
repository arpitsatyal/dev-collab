import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

interface SnippetsCreateData {
  title: string;
  language: string;
  content: string;
  authorId: string;
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
    query: { projectId },
    method,
  } = req;

  switch (method) {
    case "GET":
      try {
        const id = Array.isArray(projectId) ? projectId[0] : projectId;

        if (!id) {
          return res.status(400).json({ error: "Project ID is required" });
        }

        const snippets = await prisma.snippet.findMany({
          where: {
            projectId: id,
          },
        });

        return res.status(200).json(snippets);
      } catch (error) {
        console.error("Error fetching snippets:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const { title, language, content, projectId } =
          req.body as SnippetsCreateData;

        const snippet = await prisma.snippet.create({
          data: {
            title,
            language,
            content,
            authorId: user.id,
            projectId: projectId,
          },
        });

        return res.status(200).json(snippet);
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
