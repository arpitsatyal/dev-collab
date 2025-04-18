import { Liveblocks } from "@liveblocks/node";
import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { user } = session;

  const userId = user.id || user.email;
  const userInfo: Liveblocks["UserMeta"]["info"] = {
    name: user.name || "Anonymous",
    avatar: user.image || "",
    email: user.email || "",
  };

  try {
    const { status, body } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [],
      },
      {
        userInfo,
      }
    );

    return res.status(status).json(JSON.parse(body));
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
