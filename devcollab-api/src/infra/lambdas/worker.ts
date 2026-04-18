import { Resource } from "sst";
import sgMail from "@sendgrid/mail";
import { SQSEvent } from "aws-lambda";

const templateIds = {
  taskCreated: "d-f6bf222f775e4ab1a120b2a149a61803",
  taskUpdated: "d-a0da9a2d152c4984918d82955a6743f7",
  nearingDueDate: "d-c6360f41c61246f4ad9a20ed170d9669",
};

export const handler = async (event: SQSEvent) => {
  sgMail.setApiKey(Resource.SENDGRID_API_KEY.value);

  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const {
        assigneeEmail,
        assigneeName,
        taskTitle,
        emailType,
        projectId,
        status,
        taskDescription,
        dueDate,
      } = message;

      if (!templateIds[emailType as keyof typeof templateIds]) {
        console.warn("Unknown email type:", emailType);
        continue;
      }

      const domain = process.env.APP_DOMAIN || "https://www.devcollab.store";
      const taskLink = `${domain}/workspaces/${projectId}/work-items`;

      const baseData = { assigneeEmail, assigneeName, taskTitle, taskLink };
      let dynamicData = { ...baseData };

      if (emailType === "taskCreated") {
        dynamicData = {
          ...dynamicData,
          ...(taskDescription && { taskDescription }),
          ...(dueDate && { dueDate }),
        };
      } else if (emailType === "taskUpdated") {
        dynamicData = {
          ...dynamicData,
          ...(status && { status }),
        };
      } else if (emailType === "nearingDueDate") {
        dynamicData = {
          ...dynamicData,
          ...(dueDate && { dueDate }),
        };
      }

      const msg = {
        to: assigneeEmail,
        from: "noreply@devcollab.store",
        templateId: templateIds[emailType as keyof typeof templateIds],
        dynamicTemplateData: dynamicData,
      };

      await sgMail.send(msg);
      console.log(`[Worker] Sent ${emailType} email to ${assigneeEmail}`);
    }
  } catch (error) {
    console.error("[Worker] Error processing SQS message:", error);
    throw error;
  }
};
