
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { suggestWorkItems } from "../../../lib/ai/services/suggestionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { workspaceId } = req.query;

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    try {
        const suggestions = await suggestWorkItems(workspaceId);
        return res.status(200).json({ suggestions });
    } catch (error: any) {
        console.error("Error in suggest-work-items API:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
