/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "devcollab",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    // 1. Secrets (Stored in AWS SSM)
    const dbUrl = new sst.Secret("DATABASE_URL");
    const sendgridApiKey = new sst.Secret("SENDGRID_API_KEY");
    
    // Additional API Secrets
    const googleClientId = new sst.Secret("GOOGLE_CLIENT_ID");
    const googleClientSecret = new sst.Secret("GOOGLE_CLIENT_SECRET");
    const githubClientId = new sst.Secret("GITHUB_CLIENT_ID");
    const githubClientSecret = new sst.Secret("GITHUB_CLIENT_SECRET");
    const togetherApiKey = new sst.Secret("TOGETHER_API_KEY");
    const liveblocksSecretKey = new sst.Secret("LIVEBLOCKS_SECRET_KEY");
    const qstashToken = new sst.Secret("QSTASH_TOKEN");
    const qstashCurrentKey = new sst.Secret("QSTASH_CURRENT_SIGNING_KEY");
    const qstashNextKey = new sst.Secret("QSTASH_NEXT_SIGNING_KEY");
    const pineconeApiKey = new sst.Secret("PINECONE_API_KEY");
    const groqApiKey = new sst.Secret("GROQ_API_KEY");
    const meilisearchApiKey = new sst.Secret("MEILISEARCH_API_KEY");

    // Config Secrets
    const pineconeIndex = new sst.Secret("PINECONE_INDEX");
    const meilisearchHost = new sst.Secret("MEILISEARCH_HOST");
    const meilisearchIndex = new sst.Secret("MEILISEARCH_INDEX");
    const preferredLlmProvider = new sst.Secret("PREFERRED_LLM_PROVIDER");
    const missionQueueUrl = new sst.Secret("MISSION_QUEUE_URL");
    const importQueueUrl = new sst.Secret("IMPORT_QUEUE_URL");

    // 2. SQS Queue for notifications
    const queue = new sst.aws.Queue("TaskNotificationsQueue");

    // 3. Worker (SQS Subscriber)
    queue.subscribe({
      handler: "devcollab-api/src/infra/lambdas/worker.handler",
      link: [sendgridApiKey],
      environment: {
        APP_DOMAIN: "https://devcollab.site",
      },
    });

    // 4. Cron Job (Hourly)
    new sst.aws.CronV2("DueDateCron", {
      schedule: "cron(10 12 * * ? *)",
      job: {
        handler: "devcollab-api/src/infra/lambdas/cron.handler",
        link: [dbUrl, queue],
      },
    });

    // 5. VPC and ECS Cluster for the API
    const vpc = new sst.aws.Vpc("DevCollabVpc");
    const cluster = new sst.aws.Cluster("DevCollabCluster", { vpc });

    // 6. API Service (Fargate)
    const api = cluster.addService("ApiService", {
      cpu: "0.25 vCPU",
      memory: "0.5 GB",
      link: [
        dbUrl, 
        queue, 
        sendgridApiKey,
        googleClientId,
        googleClientSecret,
        githubClientId,
        githubClientSecret,
        togetherApiKey,
        liveblocksSecretKey,
        qstashToken,
        qstashCurrentKey,
        qstashNextKey,
        pineconeApiKey,
        groqApiKey,
        meilisearchApiKey,
        pineconeIndex,
        meilisearchHost,
        meilisearchIndex,
        preferredLlmProvider,
        missionQueueUrl,
        importQueueUrl
      ],
      loadBalancer: {
        domain: "api.devcollab.site",
        ports: [{ listen: "80/http", forward: "4000/http" }],
      },
      image: {
        context: "./devcollab-api",
      },
      environment: {
        PORT: "4000",
        DATABASE_URL: dbUrl.value,
        QUEUE_URL: queue.url,
        FRONTEND_URL: "https://devcollab.site",
        PINECONE_INDEX: pineconeIndex.value,
        MEILISEARCH_HOST: meilisearchHost.value,
        MEILISEARCH_INDEX: meilisearchIndex.value,
        PREFERRED_LLM_PROVIDER: preferredLlmProvider.value,
        MISSION_QUEUE_URL: missionQueueUrl.value,
        IMPORT_QUEUE_URL: importQueueUrl.value,
        APP_URL: "https://devcollab.site",
        API_URL: "https://api.devcollab.site",
        SENDGRID_API_KEY: sendgridApiKey.value,
        GOOGLE_CLIENT_ID: googleClientId.value,
        GOOGLE_CLIENT_SECRET: googleClientSecret.value,
        GITHUB_CLIENT_ID: githubClientId.value,
        GITHUB_CLIENT_SECRET: githubClientSecret.value,
        TOGETHER_API_KEY: togetherApiKey.value,
        LIVEBLOCKS_SECRET_KEY: liveblocksSecretKey.value,
        QSTASH_TOKEN: qstashToken.value,
        QSTASH_CURRENT_SIGNING_KEY: qstashCurrentKey.value,
        QSTASH_NEXT_SIGNING_KEY: qstashNextKey.value,
        PINECONE_API_KEY: pineconeApiKey.value,
        GROQ_API_KEY: groqApiKey.value,
        MEILISEARCH_API_KEY: meilisearchApiKey.value,
      },
    });

    // 7. Frontend (Next.js)
    const frontend = new sst.aws.Nextjs("Frontend", {
      path: "dev-collab-client",
      domain: "devcollab.site",
      environment: {
        NEXT_PUBLIC_API_GATEWAY_URL: "https://api.devcollab.site",
        NEXT_PUBLIC_API_URL: "",
      },
    });

    return {
      queueUrl: queue.url,
      apiUrl: api.url,
      frontendUrl: frontend.url,
    };
  },
});
