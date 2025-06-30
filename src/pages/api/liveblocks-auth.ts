import { Liveblocks } from "@liveblocks/node";
import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";
import { getSecret } from "../../utils/secrets";

const liveblocks = new Liveblocks({
  secret: getSecret("LIVEBLOCKS_SECRET_KEY"),
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
  try {
    const userId = user.id || user.email;

    const userInfo = {
      name: user.name || "Anonymous",
      email: user.email || "",
      avatar: user.image || "",
      color: "#0074C2",
    };

    const session = liveblocks.prepareSession(userId, { userInfo });
    const allowedPrefixes = [`snippet_`, `snippet_draft_`, `playground_`, `docs_`];
    const { room } = req.body;

    const isAllowedRoom =
      typeof room === "string" &&
      allowedPrefixes.some((prefix) => room.startsWith(prefix));

    if (isAllowedRoom) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { body, status } = await session.authorize();
    return res.status(status).json(JSON.parse(body));
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
