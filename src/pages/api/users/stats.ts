
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/db/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        const [workspacesCount, snippetsCount, docsCount, workItemsCount] = await Promise.all([
            prisma.project.count({ where: { ownerId: user.id } }),
            prisma.snippet.count({ where: { authorId: user.id } }),
            prisma.doc.count({ where: { project: { ownerId: user.id } } }),
            prisma.task.count({ where: { project: { ownerId: user.id } } }),
        ]);

        return res.status(200).json({
            workspaces: workspacesCount,
            snippets: snippetsCount,
            docs: docsCount,
            workItems: workItemsCount,
        });
    } catch (error: any) {
        console.error("Error fetching stats:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
