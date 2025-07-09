import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    query: { userId },
    method,
  } = req;
  switch (method) {
    case "GET":
      try {
        if (userId) {
          const user = await prisma.user.findUnique({
            where: {
              id: userId as string,
            },
          });

          if (!user) {
            return res.status(404).json({ error: "user not found" });
          }

          return res.status(200).json(user);
        }
        const users = await prisma.user.findMany();
        return res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }

    default:
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
  }
}
