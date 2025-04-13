import { getSession } from "next-auth/react";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

interface ProjectCreateData {
  title: string;
}

interface SessionUser {
  id: string;
  [key: string]: any; // Allow for other user properties
}

interface Session {
  user: SessionUser;
  [key: string]: any; // Allow for other session properties
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getSession({ req })) as Session | null;

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    try {
      const { title } = req.body as ProjectCreateData;

      const project = await prisma.project.create({
        data: {
          title,
          userId: session.user.id, // Links to the logged-in user
        },
      });

      return res.status(200).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end();
}
