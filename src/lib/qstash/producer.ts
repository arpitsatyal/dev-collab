import { getSecret } from "../../utils/secrets";
import { qstash } from "./client";

export type EventType = 'project' | 'task' | 'snippet' | 'doc';

export async function publishSyncEvent(
    type: EventType,
    data: any,
    action: 'upsert' | 'delete' = 'upsert'
) {
    const appUrl = getSecret("APP_URL");
    const webhookUrl = `${appUrl}/api/webhooks/vector-sync`;

    try {
        const result = await qstash.publishJSON({
            queue: "vector-sync-queue",
            url: webhookUrl,
            body: { type, data: { id: data.id }, action },
            contentBasedDeduplication: true,
            retries: 3,
        });

        console.log(`[QStash] Published messageId: ${result.messageId}`);
        return result.messageId;

    } catch (err) {
        console.error(`[QStash] Failed to publish sync event for ${type}: ${data.id}`, err);
    }
}