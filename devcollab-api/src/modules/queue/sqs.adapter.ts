import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { QueueProviderPort } from './ports/queue-provider.port';

@Injectable()
export class SqsAdapter implements QueueProviderPort {
  private readonly logger = new Logger(SqsAdapter.name);
  private readonly sqsClient = new SQSClient({ region: 'us-east-2' });

  async sendRawMessage(url: string, body: string): Promise<void> {
    try {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: url,
          MessageBody: body,
        }),
      );
    } catch (error) {
      this.logger.error(`SQS sendRawMessage failed: ${error.message}`);
      throw error;
    }
  }
}
