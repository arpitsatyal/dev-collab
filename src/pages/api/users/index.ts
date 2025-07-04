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
    query: { userIds },
    method,
  } = req;

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    if (!userIds) {
      const users = await prisma.user.findMany();
      return res.status(200).json(users);
    }

    const ids = Array.isArray(userIds) ? userIds : userIds ? [userIds] : [];

    const users = await prisma.user.findMany({
      where: {
        OR: [{ id: { in: ids } }, { email: { in: ids } }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ error: "No users found for provided userIds" });
    }

    const formattedUsers = users.map((user) => ({
      id: user.id || user.email,
      name: user.name || user.email?.split("@")[0] || "Unknown",
      email: user.email || "",
      avatar: user.image || "",
      color: "#0074C2",
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
