import { Resource } from "sst";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
const dayjs = require('dayjs');
import { workItems as workItemsTable, users as usersTable } from "../../common/drizzle/schema";
import { and, gte, lte, isNotNull } from "drizzle-orm";
import { sendQueueMessage } from "../../common/shared/sqs.helper";

export const handler = async () => {
  const startTime = dayjs();
  console.log(`[${startTime.format("YYYY-MM-DD HH:mm:ss")}] Starting due date check (Monorepo Lambda)`);

  const sql = postgres(Resource.DATABASE_URL.value);
  const db = drizzle(sql);

  try {
    const now = dayjs();
    const thresholdDate = dayjs().add(1, "day");

    const nearingDueItems = await db
      .select({
        id: workItemsTable.id,
        title: workItemsTable.title,
        dueDate: workItemsTable.dueDate,
        workspaceId: workItemsTable.workspaceId,
        assigneeName: usersTable.name,
        assigneeEmail: usersTable.email,
      })
      .from(workItemsTable)
      .leftJoin(usersTable, isNotNull(workItemsTable.assignedToId))
      .where(
        and(
          gte(workItemsTable.dueDate, now.toDate()),
          lte(workItemsTable.dueDate, thresholdDate.toDate())
        )
      );

    console.log(`Found ${nearingDueItems.length} work items nearing due date`);

    for (const item of nearingDueItems) {
      if (!item.assigneeEmail) continue;

      const messageBody = {
        assigneeName: item.assigneeName,
        assigneeEmail: item.assigneeEmail,
        taskTitle: item.title,
        dueDate: dayjs(item.dueDate).format("MMMM D, YYYY"),
        projectId: item.workspaceId,
        emailType: "nearingDueDate",
      };

      await sendQueueMessage(Resource.TaskNotificationsQueue.url, messageBody);
      console.log(`Queued notification for work item ${item.id}`);
    }

    return { statusCode: 200, body: `Success: ${nearingDueItems.length} items processed` };
  } catch (error) {
    console.error("Error in cron handler:", error);
    throw error;
  } finally {
    await sql.end();
  }
};
