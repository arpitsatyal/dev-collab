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

    // 2. SQS Queue for notifications
    const queue = new sst.aws.Queue("TaskNotificationsQueue");

    // 3. Worker (SQS Subscriber)
    // Listens to the queue and sends emails via SendGrid
    queue.subscribe({
      handler: "devcollab-api/src/infra/lambdas/worker.handler",
      link: [sendgridApiKey],
      environment: {
        APP_DOMAIN: "https://www.devcollab.store",
      },
    });

    // 4. Cron Job (Hourly)
    // Queries database and pushes to the SQS queue
    new sst.aws.Cron("DueDateCron", {
      schedule: "rate(1 hour)",
      job: {
        handler: "devcollab-api/src/infra/lambdas/cron.handler",
        link: [dbUrl, queue],
      },
    });

    return {
      queueUrl: queue.url,
    };
  },
});
