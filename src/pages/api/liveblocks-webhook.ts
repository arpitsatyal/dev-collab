import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import prisma from "../../lib/prisma";
import axios from "axios";
import { getSecret } from "../../utils/secrets";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const rawBody = await buffer(req);

  try {
    const payload = JSON.parse(rawBody.toString());

    if (payload.type !== "ydocUpdated") {
      return res.status(400).json({ error: "Unhandled event" });
    }

    const { data } = payload;

    const response = await axios.get(
      `https://api.liveblocks.io/v2/rooms/${data.roomId}/ydoc`,
      {
        headers: {
          Authorization: `Bearer ${getSecret("LIVEBLOCKS_SECRET_KEY")}`,
          Accept: "application/octet-stream",
        },
        responseType: "arraybuffer",
      }
    );

    const content = response.data.toString("utf8");

    if (!content) {
      console.warn(`No content found in Y.Map for roomId: ${data.roomId}`);
      return res.status(200).json({ message: "No content to update" });
    }

    await prisma.doc.update({
      where: { roomId: data.roomId },
      data: { content },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
