/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	ELASTICSEARCH_URL
	ES_API_KEY
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const { Client: PgClient } = require("pg");
const { Client } = require("@elastic/elasticsearch");

const pg = new PgClient({
  connectionString: process.env.NEON_DB_URL,
});

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

exports.handler = async (event) => {
  try {
    await pg.connect();
    console.log("✅ Connected to Neon");

    // 1. Ensure CronJobStatus table exists and is initialized
    await pg.query(`
      CREATE TABLE IF NOT EXISTS "CronJobStatus" (
        job_name TEXT PRIMARY KEY,
        last_run_at TIMESTAMP NOT NULL DEFAULT '1970-01-01'
      );
    `);

    // 2. Insert job row on first run
    await pg.query(`
    INSERT INTO "CronJobStatus" (job_name)
    VALUES ('snippets_cron')
    ON CONFLICT (job_name) DO NOTHING;
  `);

    // 2. Fetch last run time
    const { rows: statusRows } = await pg.query(`
      SELECT last_run_at FROM "CronJobStatus" WHERE job_name = 'snippets_cron';
    `);

    const lastRunAt = statusRows[0]?.last_run_at;

    // 3. Get snippets updated since last run
    const { rows: snippets } = await pg.query(
      `SELECT * FROM "Snippet" WHERE "updatedAt" > $1`,
      [lastRunAt]
    );

    if (!snippets.length) {
      console.log("❕ No new or updated snippets since last run.");
      return {
        statusCode: 400,
        body: JSON.stringify("No new or updated snippets since last run"),
      };
    }

    // 4. Index snippets into Elasticsearch
    for (const snippet of snippets) {
      try {
        await esClient.index({
          index: "snippets",
          id: snippet.id,
          body: {
            title: snippet.title,
            content: snippet.content,
            language: snippet.language,
            createdAt: snippet.createdAt,
            updatedAt: snippet.updatedAt,
            projectId: snippet.projectId,
            authorId: snippet.authorId,
            extension: snippet.extension,
            lastEditedById: snippet.lastEditedById,
          },
        });
        console.log(`✅ Snippet ${snippet.id} indexed`);
      } catch (err) {
        console.error(`❌ Failed to index snippet ${snippet.id}:`, err.message);
        return {
          statusCode: 200,
          body: JSON.stringify(`Failed to index snippet ${snippet.id}`),
        };
      }
    }

    // 5. Update the last run timestamp
    await pg.query(`
      UPDATE "CronJobStatus"
      SET last_run_at = NOW()
      WHERE job_name = 'snippets_cron';
    `);

    console.log("✅ Cron job completed.");
    return {
      statusCode: 200,
      body: JSON.stringify("Cron Job Completed"),
    };
  } catch (error) {
    console.error("🚨 Cron job error:", error.message);
    return {
      statusCode: 400,
      body: JSON.stringify("Cron Job Failed"),
    };
  } finally {
    await pg.end();
  }
};
