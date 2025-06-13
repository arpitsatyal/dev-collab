import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import dayjs from "dayjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET": {
      const now = dayjs();
      const thresholdDays = 1;
      const thresholdDate = dayjs().add(thresholdDays, "day");

      const nearingDueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: now.toDate(),
            lte: thresholdDate.toDate(),
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          projectId: true,
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json(nearingDueTasks);
    }

    default:
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
