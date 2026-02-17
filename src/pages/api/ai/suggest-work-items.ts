
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { suggestWorkItems } from "../../../lib/ai/services/suggestionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.query;

    if (!projectId || typeof projectId !== "string") {
        return res.status(400).json({ error: "Project ID is required" });
    }

    try {
        const suggestions = await suggestWorkItems(projectId);
        return res.status(200).json({ suggestions });
    } catch (error: any) {
        console.error("Error in suggest-work-items API:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
