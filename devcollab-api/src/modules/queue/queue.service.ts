import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { QueuePort } from './ports/queue.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService implements QueuePort {
  private readonly logger = new Logger(QueueService.name);
  private readonly sqsClient = new SQSClient({ region: 'us-east-2' });
  private readonly queueUrl: string;

  constructor(private configService: ConfigService) {
    this.queueUrl = this.configService.getOrThrow<string>('QUEUE_URL');
  }

  async sendMessage(messageBody: object): Promise<void> {
    try {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(messageBody),
        }),
      );
    } catch (error) {
      this.logger.warn(`SQS sendMessage failed: ${error.message}`);
    }
  }
}
