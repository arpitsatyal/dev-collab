import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: 'us-east-2' });

/**
 * A pure SQS helper that doesn't depend on NestJS Dependency Injection.
 * Used by both the API and standalone Lambdas.
 */
export async function sendQueueMessage(queueUrl: string, messageBody: object) {
  try {
    const result = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(messageBody),
      }),
    );
    return result;
  } catch (error) {
    console.error(`[SQS Helper] Failed to send message: ${error.message}`);
    throw error;
  }
}
