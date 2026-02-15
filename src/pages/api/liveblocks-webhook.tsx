import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import prisma from "../../lib/db/prisma";
import axios from "axios";
import { getSecret } from "../../utils/secrets";
import { prepareTextMentionNotificationEmailAsReact } from "@liveblocks/emails";
import { Liveblocks } from "@liveblocks/node";
import { Resend } from "resend";
import TextMentionEmail from "../../components/TextMentionEmail";

const liveblocksSecretKey = getSecret("LIVEBLOCKS_SECRET_KEY");
const resendAPIKey = getSecret("RESEND_API_KEY");

const resend = new Resend(resendAPIKey);
const liveblocks = new Liveblocks({
  secret: liveblocksSecretKey,
});

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
    const { data } = payload || {};

    if (payload.type === "notification" && data.kind === "textMention") {
      const user = await prisma.user.findUnique({
        where: {
          id: data.userId,
        },
        select: {
          email: true,
        },
      });
      const emailAddress = user?.email;
      if (!emailAddress)
        return res
          .status(400)
          .json({ error: "No associated email address was found." });

      let emailData;

      try {
        emailData = await prepareTextMentionNotificationEmailAsReact(
          liveblocks,
          payload,
          {
            resolveUsers: async ({ userIds }) => {
              const usersData = await prisma.user.findMany({
                where: {
                  id: { in: userIds },
                },
              });

              const userMap = new Map(usersData.map((u) => [u.id, u]));
              const sortedUsers = userIds
                .map((id) => userMap.get(id))
                .filter(Boolean);

              return sortedUsers.map((userData) => ({
                name: userData?.name ?? "",
                avatar: userData?.image ?? "",
                color: "0074C2",
                email: userData?.email ?? "",
              }));
            },
          }
        );
      } catch (err) {
        console.log(err);
        return res
          .status(500)
          .json({ error: "Could not fetch text mention notification data" });
      }

      // The text mention has already been read
      if (!emailData) {
        return res.status(200);
      }

      const { mention } = emailData || {};

      const author = await prisma.user.findUnique({
        where: {
          id: mention.author.id,
        },
        select: { name: true },
      });

      const docs = await prisma.doc.findFirst({
        where: {
          roomId: mention.roomId,
        },
        select: { label: true, projectId: true, id: true },
      });

      try {
        await resend.emails.send({
          from: "noreply@devcollab.store",
          to: emailAddress,
          subject: `🔔 ${author?.name ?? "someone"} mentioned you in "${docs?.label}"`,
          react: (
            <TextMentionEmail
              authorName={author?.name ?? "someone"}
              content={mention.content}
              docs={docs}
            />
          ),
        });
      } catch (err) {
        console.error(err);
      }

      return res.status(200).json({ success: true });
    }

    if (payload.type === "ydocUpdated") {
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
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
