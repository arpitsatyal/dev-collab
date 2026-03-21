
import { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "@octokit/rest";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

const octokit = new Octokit();

function parseGitHubUrl(url: string) {
    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const match = url.match(regex);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { url } = req.query;
    if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "GitHub URL is required" });
    }

    const repoDetails = parseGitHubUrl(url);
    if (!repoDetails) return res.status(400).json({ error: "Invalid GitHub URL" });

    try {
        // 1. Get default branch
        const { data: repoData } = await octokit.repos.get({
            owner: repoDetails.owner,
            repo: repoDetails.repo,
        });

        const defaultBranch = repoData.default_branch;

        // 2. Get recursive tree
        const { data: treeData } = await octokit.git.getTree({
            owner: repoDetails.owner,
            repo: repoDetails.repo,
            tree_sha: defaultBranch,
            recursive: "true",
        });

        // 3. Filter for blobs (files) and exclude noise
        const IGNORED_DIRS = ["node_modules", ".git", "dist", "build", ".next", "out"];
        const files = treeData.tree
            .filter(item =>
                item.type === "blob" &&
                !IGNORED_DIRS.some(dir => item.path?.includes(dir))
            )
            .map(item => ({
                path: item.path,
                size: item.size,
                url: item.url
            }));

        return res.status(200).json({
            owner: repoDetails.owner,
            repo: repoDetails.repo,
            defaultBranch,
            files,
            description: repoData.description
        });

    } catch (error: any) {
        console.error("Error fetching repo tree:", error);
        return res.status(error.status || 500).json({
            error: error.message || "Failed to fetch repository structure"
        });
    }
}
