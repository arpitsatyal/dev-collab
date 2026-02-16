import { Client } from "@upstash/qstash";

import { getSecret } from "../../utils/secrets";

const qstashToken = getSecret("QSTASH_TOKEN");

if (!qstashToken) {
    console.warn("[QStash] Missing QSTASH_TOKEN in environment variables.");
}

export const qstash = new Client({
    token: qstashToken || "",
});
