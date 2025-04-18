import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

interface ProjectCreateData {
  title: string;
  ownerId: string;
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

  switch (req.method) {
    case "GET":
      try {
        const projects = await prisma.project.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            snippets: true,
          },
        });
        return res.status(200).json(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const { title } = req.body as ProjectCreateData;

        const project = await prisma.project.create({
          data: {
            title,
            ownerId: user.id,
          },
        });

        return res.status(200).json(project);
      } catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
