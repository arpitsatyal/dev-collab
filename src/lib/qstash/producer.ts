import { qstash } from "./client";
import { getSecret } from "../../utils/secrets";

export type EventType = 'project' | 'task' | 'snippet' | 'doc';

export async function publishSyncEvent(type: EventType, data: any, action: 'upsert' | 'delete' = 'upsert') {
    try {
        // Determine the base URL for the webhook
        const appUrl = getSecret("APP_URL");
        const webhookUrl = `${appUrl}/api/webhooks/vector-sync`;

        await qstash.publishJSON({
            url: webhookUrl,
            body: {
                type,
                data: { id: data.id }, // Only send ID to keep payload small, consumer will fetch fresh data
                action,
            },
        });

        console.log(`[QStash] Published sync event for ${type}: ${data.id}`);
    } catch (err) {
        console.error(`[QStash] Failed to publish sync event for ${type}: ${data.id}`, err);
    }
}
