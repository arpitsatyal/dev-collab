
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { generateImplementationPlan } from "../../../lib/ai/services/suggestionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { taskId } = req.query;

    if (!taskId || typeof taskId !== "string") {
        return res.status(400).json({ error: "Task ID is required" });
    }

    try {
        const plan = await generateImplementationPlan(taskId);
        return res.status(200).json({ plan });
    } catch (error: any) {
        console.error("Error in analyze-work-item API:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
