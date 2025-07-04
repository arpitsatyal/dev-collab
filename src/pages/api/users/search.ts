import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.query;
    if (typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'text' query parameter" });
    }

    const decodedText = decodeURIComponent(text).trim().toLowerCase();
    const users = await prisma.user.findMany();

    const filteredUserIds = users
      .filter(
        (user) => user.name && user.name.toLowerCase().includes(decodedText)
      )
      .map((user) => user.id);

    return res.status(200).json(filteredUserIds);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
