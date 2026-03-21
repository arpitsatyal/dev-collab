import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { WorkItemStatus } from "../../../types";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import dayjs from "dayjs";
import { getSecret } from "../../../utils/secrets";
import { publishSyncEvent } from "../../../lib/qstash/producer";

export interface WorkItemCreateData {
  title: string;
  workspaceId: string;
  status: WorkItemStatus;
  description: string | null;
  assignedToId: string | null;
  dueDate: Date | null;
  snippetIds?: string[];
}

type emailType = "workItemCreated" | "workItemUpdated";

interface MessageBody {
  assigneeEmail: string;
  assigneeName: string;
  emailType: emailType;
  workItemTitle: string;
  workspaceId: string;
  status?: WorkItemStatus;
  workItemDescription?: string | null;
  dueDate?: string | null;
}

const sqsClient = new SQSClient({ region: "us-east-2" });

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
    query: { workspaceId, workItemId },
    method,
  } = req;

  if (!workspaceId) {
    return res.status(400).json({ error: "Workspace ID is required" });
  }

  switch (method) {
    case "GET": {
      if (!workspaceId) {
        return res.status(400).json({ error: "Workspace ID is required" });
      }

      const workItems = await prisma.workItem.findMany({
        where: {
          workspaceId: workspaceId as string,
        },
      });

      if (!workItems) {
        return res.status(404).json({ error: "WorkItems not found" });
      }

      return res.status(200).json(workItems);
    }

    case "POST":
      try {
        const { title, description, assignedToId, dueDate, status, snippetIds } =
          (req.body as WorkItemCreateData) ?? {};

        const workItem = await prisma.workItem.create({
          data: {
            title,
            description,
            dueDate,
            status,
            workspaceId: workspaceId as string,
            assignedToId,
            authorId: user.id,
            snippets: snippetIds ? {
              connect: snippetIds.map(id => ({ id }))
            } : undefined
          },
        });

        const assignee = await prisma.user.findUnique({
          where: {
            id: workItem.assignedToId ?? "",
          },
        });

        const messageBody: MessageBody = {
          assigneeEmail: assignee?.email ?? "",
          assigneeName: assignee?.name ?? "Team Member",
          workspaceId: workItem.workspaceId,
          workItemTitle: workItem.title,
          workItemDescription: workItem.description,
          dueDate: workItem.dueDate
            ? dayjs(workItem.dueDate).format("MMMM D, YYYY")
            : null,
          emailType: "workItemCreated",
        };

        try {
          if (assignee?.email) {
            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl: getSecret("QUEUE_URL"),
                MessageBody: JSON.stringify(messageBody),
              })
            );
          }
        } catch (queueError) {
          console.log("Error processing queue", queueError);
        }

        await publishSyncEvent('workItem', workItem);

        return res.status(200).json(workItem);
      } catch (error) {
        console.error("Error creating workItem:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    case "PATCH":
      try {
        if (!workItemId) {
          return res.status(400).json({ error: "WorkItem ID is required" });
        }

        if (!req.body.newStatus) {
          return res
            .status(400)
            .json({ error: "Please provide a new status." });
        }

        const updatedWorkItem = await prisma.workItem.update({
          where: {
            id: workItemId as string,
          },
          data: {
            status: req.body.newStatus as WorkItemStatus,
          },
        });

        const assignee = await prisma.user.findUnique({
          where: {
            id: updatedWorkItem.assignedToId ?? "",
          },
        });

        const messageBody: MessageBody = {
          assigneeEmail: assignee?.email ?? "",
          assigneeName: assignee?.name ?? "Team Member",
          workspaceId: updatedWorkItem.workspaceId,
          workItemTitle: updatedWorkItem.title,
          status: updatedWorkItem?.status,
          emailType: "workItemUpdated",
        };

        try {
          if (assignee?.email) {
            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl: getSecret("QUEUE_URL"),
                MessageBody: JSON.stringify(messageBody),
              })
            );
          }
        } catch (queueError) {
          console.log("Error processing queue", queueError);
        }

        await publishSyncEvent('workItem', updatedWorkItem);

        return res.status(200).json(updatedWorkItem);
      } catch (error) {
        console.error("Error updating workItem:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
