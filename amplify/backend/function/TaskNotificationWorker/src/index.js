const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);

      const { assigneeEmail, taskTitle, newStatus } = message;

      const msg = {
        to: assigneeEmail,
        from: "noreply@devcollab.store",
        subject: `Task Update: ${taskTitle}`,
        text: `Task ${taskTitle} has been updated to ${newStatus}.`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9; }
        .header { background-color: #2c3e50; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; }
        .footer { font-size: 12px; color: #7f8c8d; text-align: center; padding-top: 10px; border-top: 1px solid #e0e0e0; }
        .highlight { color: #2980b9; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Task Update Notification</h2>
        </div>
        <div class="content">
          <p>Dear Team Member,</p>
          <p>We are pleased to inform you that the task <span class="highlight">${taskTitle}</span> has been updated to <span class="highlight">${newStatus}</span>.</p>
          <p>Please review the task details and take any necessary actions. If you have any questions, feel free to reach out.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Dev-Collab. Do not reply to this email.</p>
          <p>&copy; 2025 Dev-Collab. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
      };

      await sgMail.send(msg);
    }

    return { statusCode: 200, body: JSON.stringify("Processed") };
  } catch (error) {
    console.error("Error processing the message", error);
    throw error;
  }
};
