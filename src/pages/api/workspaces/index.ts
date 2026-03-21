import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { WorkspaceWithPin } from "../../../types";
import { publishSyncEvent } from "../../../lib/qstash/producer";

export interface WorkspaceCreateData {
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
    query: { workspaceId, limit, skip },
    method,
  } = req;

  const toSkip = skip ? parseInt(Array.isArray(skip) ? skip[0] : skip) : 10;
  const toLimit = limit
    ? parseInt(Array.isArray(limit) ? limit[0] : limit)
    : 10;

  switch (method) {
    case "GET":
      try {
        if (workspaceId) {
          const workspace = await prisma.workspace.findUnique({
            where: {
              id: workspaceId as string,
            },
          });

          if (!workspace) {
            return res.status(404).json({ error: "workspace not found" });
          }

          return res.status(200).json(workspace);
        }

        const userId = user.id as string;

        const workspaces = await prisma.$queryRaw<WorkspaceWithPin[]>`
        SELECT p.*,
              (upp."userId" IS NOT NULL) AS "isPinned"
        FROM "Workspace" p
        LEFT JOIN "UserPinnedWorkspace" upp
          ON upp."userId" = ${userId}
          AND upp."workspaceId" = p."id"
        ORDER BY "isPinned" DESC, p."createdAt" DESC
        OFFSET ${toSkip}
        LIMIT ${toLimit};
        `;

        return res.status(200).json(workspaces);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "POST":
      try {
        const { title, description } = req.body as WorkspaceCreateData;

        if (!title) return res.status(400).json({ msg: "title is required" });
        const workspace = await prisma.workspace.create({
          data: {
            title,
            description,
            ownerId: user.id,
          },
        });

        await publishSyncEvent('workspace', workspace);

        return res.status(200).json(workspace);
      } catch (error) {
        console.error("Error creating workspace:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "PATCH":
      try {
        if (typeof user.id !== "string") {
          return res.status(400).json({ error: "Invalid user id" });
        }
        if (typeof workspaceId !== "string") {
          return res.status(400).json({ error: "Invalid workspace id" });
        }

        const userId = user.id;

        if (req.body.isPinned) {
          await prisma.userPinnedWorkspace.upsert({
            where: {
              userId_workspaceId: {
                userId,
                workspaceId,
              },
            },
            update: {},
            create: {
              userId,
              workspaceId,
            },
          });
        } else {
          await prisma.userPinnedWorkspace.deleteMany({
            where: {
              userId,
              workspaceId,
            },
          });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error updating workspace:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
