import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { ProjectWithPin } from "../../../types";

export interface ProjectCreateData {
  title: string;
  ownerId: string;
  description?: string;
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
    query: { projectId, limit, skip },
    method,
  } = req;

  const toSkip = skip ? parseInt(Array.isArray(skip) ? skip[0] : skip) : 10;
  const toLimit = limit
    ? parseInt(Array.isArray(limit) ? limit[0] : limit)
    : 10;

  switch (method) {
    case "GET":
      try {
        if (projectId) {
          const project = await prisma.project.findUnique({
            where: {
              id: projectId as string,
            },
          });

          if (!project) {
            return res.status(404).json({ error: "project not found" });
          }

          return res.status(200).json(project);
        }

        const userId = user.id as string;

        const projects = await prisma.$queryRaw<ProjectWithPin[]>`
        SELECT p.*,
              (upp."userId" IS NOT NULL) AS "isPinned"
        FROM "Project" p
        LEFT JOIN "UserPinnedProject" upp
          ON upp."userId" = ${userId}
          AND upp."projectId" = p."id"
        ORDER BY "isPinned" DESC, p."createdAt" DESC
        OFFSET ${toSkip}
        LIMIT ${toLimit};
        `;

        res.status(200).json(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const { title, description } = req.body as ProjectCreateData;

        if (!title) return res.status(400).json({ msg: "title is required" });
        const project = await prisma.project.create({
          data: {
            title,
            description,
            ownerId: user.id,
          },
        });

        return res.status(200).json(project);
      } catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "PATCH":
      try {
        if (typeof user.id !== "string") {
          return res.status(400).json({ error: "Invalid user id" });
        }
        if (typeof projectId !== "string") {
          return res.status(400).json({ error: "Invalid project id" });
        }

        const userId = user.id;

        if (req.body.isPinned) {
          await prisma.userPinnedProject.upsert({
            where: {
              userId_projectId: {
                userId,
                projectId,
              },
            },
            update: {},
            create: {
              userId,
              projectId,
            },
          });
        } else {
          await prisma.userPinnedProject.deleteMany({
            where: {
              userId,
              projectId,
            },
          });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error updating project:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
