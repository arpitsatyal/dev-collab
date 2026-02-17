
import { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "@octokit/rest";
import prisma from "../../../lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { publishSyncEvent } from "../../../lib/qstash/producer";

const octokit = new Octokit();

function parseGitHubUrl(url: string) {
    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const match = url.match(regex);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

const SNIPPET_EXTENSIONS = [
    "js", "jsx", "ts", "tsx", "py", "go", "rb", "php", "java", "c", "cpp", "cs", "rs", "html", "css", "scss", "yml", "yaml", "sh", "sql"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { method } = req;
    if (method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const { url, selectedFiles } = req.body;
    if (!url) return res.status(400).json({ error: "GitHub URL is required" });
    if (!selectedFiles || !Array.isArray(selectedFiles) || selectedFiles.length === 0) {
        return res.status(400).json({ error: "No files selected for import" });
    }

    const repoDetails = parseGitHubUrl(url);
    if (!repoDetails) return res.status(400).json({ error: "Invalid GitHub URL" });

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: "User not found" });

        // 1. Get repo metadata (for default branch and description)
        const { data: repoData } = await octokit.repos.get({
            owner: repoDetails.owner,
            repo: repoDetails.repo,
        });

        const defaultBranch = repoData.default_branch;

        // 2. Create Project
        const project = await prisma.project.create({
            data: {
                title: repoDetails.repo,
                description: repoData.description,
                ownerId: user.id,
            },
        });

        // 3. Fetch contents in PARALLEL
        console.log(`🚀 Parallel fetching ${selectedFiles.length} files...`);

        const fetchResults = await Promise.all(
            selectedFiles.map(async (path) => {
                try {
                    const { data: contentData } = await octokit.repos.getContent({
                        owner: repoDetails.owner,
                        repo: repoDetails.repo,
                        path,
                        ref: defaultBranch,
                    });

                    if (Array.isArray(contentData) || contentData.type !== "file") return null;

                    const content = Buffer.from(contentData.content, "base64").toString("utf-8");
                    const ext = path.split(".").pop()?.toLowerCase();
                    const fileName = path.split("/").pop() || "";

                    return { path, fileName, ext, content };
                } catch (e) {
                    console.error(`Failed to fetch ${path}:`, e);
                    return null;
                }
            })
        );

        const snippetsData = [];
        const docsData = [];

        for (const result of fetchResults) {
            if (!result) continue;

            if (result.ext === "md") {
                docsData.push({
                    label: result.fileName,
                    projectId: project.id,
                    roomId: crypto.randomUUID(),
                    content: { type: "doc", content: result.content }
                });
            } else if (SNIPPET_EXTENSIONS.includes(result.ext || "")) {
                snippetsData.push({
                    title: result.fileName.replace(`.${result.ext}`, ""),
                    language: result.ext || "plaintext",
                    extension: result.ext || "",
                    content: JSON.stringify(result.content),
                    projectId: project.id,
                    authorId: user.id,
                });
            }
        }

        // 4. Batch Insert
        if (snippetsData.length > 0) {
            await prisma.snippet.createMany({ data: snippetsData });
        }
        if (docsData.length > 0) {
            await prisma.doc.createMany({ data: docsData });
        }

        await publishSyncEvent("project", project);

        return res.status(200).json({
            success: true,
            project,
            stats: { snippets: snippetsData.length, docs: docsData.length }
        });

    } catch (error: any) {
        console.error("Error importing repo:", error);
        return res.status(500).json({ error: error.message || "Failed to import repository" });
    }
}
