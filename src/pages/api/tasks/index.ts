import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { TaskStatus } from "@prisma/client";

export interface TaskCreateData {
  title: string;
  projectId: string;
  status: TaskStatus;
  description: string | null;
  assignedToId: string | null;
  dueDate: Date | null;
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
    case "GET": {
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const tasks = await prisma.task.findMany({
        where: {
          projectId: projectId as string,
        },
      });

      if (!tasks) {
        return res.status(404).json({ error: "Tasks not found" });
      }

      return res.status(200).json(tasks);
    }

    case "POST":
      try {
        const { title, description, assignedToId, dueDate, status } =
          (req.body as TaskCreateData) ?? {};

        const task = await prisma.task.create({
          data: {
            title,
            description,
            dueDate,
            status,
            projectId: projectId as string,
            assignedToId,
            authorId: user.id,
          },
        });

        return res.status(200).json(task);
      } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
