const { PrismaClient } = require("@prisma/client");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const dayjs = require("dayjs");

const prisma = new PrismaClient();
const sqsClient = new SQSClient({ region: "us-east-2" });
const queueUrl = process.env.QUEUE_URL;

exports.handler = async () => {
  const startTime = dayjs();
  console.log(
    `[${startTime.format("YYYY-MM-DD HH:mm:ss")}] Starting due date check`
  );

  try {
    const now = dayjs();
    const thresholdDays = 1;
    const thresholdDate = dayjs().add(thresholdDays, "day");

    console.log(
      `[${now.format(
        "YYYY-MM-DD HH:mm:ss"
      )}] Querying tasks with due date between ${now.format(
        "YYYY-MM-DD"
      )} and ${thresholdDate.format("YYYY-MM-DD")}`
    );
    const nearingDueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now.toDate(),
          lte: thresholdDate.toDate(),
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        projectId: true,
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] Found ${
        nearingDueTasks.length
      } tasks nearing due date`
    );
    for (const task of nearingDueTasks) {
      if (!task.assignedTo) {
        console.log(
          `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] Skipping task ${
            task.id
          } due to missing assignee`
        );
        continue;
      }

      const messageBody = {
        assigneeName: task.assignedTo.name,
        assigneeEmail: task.assignedTo.email,
        taskTitle: task.title,
        dueDate: dayjs(task.dueDate).format("MMMM D, YYYY"),
        projectId: task.projectId,
        emailType: "nearingDueDate",
      };

      console.log(
        `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] Queuing message for task ${
          task.id
        }:`,
        messageBody
      );
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(messageBody),
        })
      );
      console.log(
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss"
        )}] Successfully queued message for task ${task.id}`
      );
    }

    const endTime = dayjs();
    console.log(
      `[${endTime.format(
        "YYYY-MM-DD HH:mm:ss"
      )}] Completed due date check. Total tasks queued: ${
        nearingDueTasks.length
      }. Duration: ${endTime.diff(startTime, "seconds")}s`
    );
    return {
      statusCode: 200,
      body: `Queued ${nearingDueTasks.length} due date warnings`,
    };
  } catch (error) {
    const errorTime = dayjs();
    console.error(
      `[${errorTime.format("YYYY-MM-DD HH:mm:ss")}] Error checking due dates:`,
      error
    );
    throw error;
  }
};
