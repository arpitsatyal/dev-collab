import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { suggestSnippetFilenameForCode } from "../../../lib/ai/services/suggestionService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { workspaceId, code, language } = req.body || {};

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    if (!code || typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ error: "Code is required" });
    }

    try {
        const fileName = await suggestSnippetFilenameForCode({
            workspaceId,
            code,
            language: typeof language === "string" ? language : undefined,
        });

        return res.status(200).json({ fileName });
    } catch (error: any) {
        console.error("Error in suggest-snippet-filename API:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

