import { NextApiRequest, NextApiResponse } from "next";
import { Receiver } from "@upstash/qstash";
import { syncToVectorStore, SyncType } from "../../../lib/ai/vectorStoreSync";
import { getSecret } from "../../../utils/secrets";

const receiver = new Receiver({
    currentSigningKey: getSecret("QSTASH_CURRENT_SIGNING_KEY") || "",
    nextSigningKey: getSecret("QSTASH_NEXT_SIGNING_KEY") || "",
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
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify QStash signature
    const signature = req.headers["upstash-signature"] as string;
    const body = await new Promise<string>((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(data));
        req.on("error", (err) => reject(err));
    });

    try {
        const isValid = await receiver.verify({
            signature,
            body,
        });

        if (!isValid) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        const payload = JSON.parse(body);
        const { type, data, action } = payload;

        console.log(`[QStash Webhook] Received sync request for ${type}: ${data.id} (${action})`);

        await syncToVectorStore(type as SyncType, data.id, action as 'upsert' | 'delete');

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("[QStash Webhook] Error processing sync:", err.message || err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
