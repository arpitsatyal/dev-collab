// dev-collab-client/open-next.config.ts
import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

const config: OpenNextConfig = {
    default: {
        override: {
            wrapper: "aws-lambda-streaming",
        },
        install: {
            packages: ["tslib", "axios", "rimraf"],
        },
    },
};

export default config;