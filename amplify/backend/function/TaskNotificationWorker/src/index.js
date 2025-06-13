const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const templateIds = {
  taskCreated: "d-f6bf222f775e4ab1a120b2a149a61803",
  taskUpdated: "d-a0da9a2d152c4984918d82955a6743f7",
  nearingDueDate: "d-c6360f41c61246f4ad9a20ed170d9669",
};

exports.handler = async (event) => {
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

      if (!templateIds[emailType]) {
        console.log("Unknown email type:", emailType);
        continue;
      }

      const taskLink = `${process.env.APP_DOMAIN}/projects/${projectId}/tasks`;

      const baseData = { assigneeEmail, assigneeName, taskTitle, taskLink };
      const dynamicData =
        emailType === "taskCreated"
          ? { ...baseData, taskDescription, dueDate }
          : emailType === "taskUpdated"
          ? { ...baseData, status }
          : emailType === "nearingDueDate"
          ? { ...baseData, dueDate }
          : baseData;

      const msg = {
        to: assigneeEmail,
        from: "noreply@devcollab.store",
        templateId: templateIds[emailType],
        dynamicTemplateData: dynamicData,
      };

      await sgMail.send(msg);
      return { statusCode: 200, body: "Processing complete" };
    }
  } catch (error) {
    console.error("Error processing the message", error);
    throw error;
  }
};
