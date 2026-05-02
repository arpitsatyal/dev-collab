import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { QueuePort } from './ports/queue.port';
import { QueueType } from './enums/queue-type.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService implements QueuePort {
  private readonly logger = new Logger(QueueService.name);
  private readonly sqsClient = new SQSClient({ region: 'us-east-2' });
  private readonly queueUrls: Record<QueueType, string>;

  constructor(private configService: ConfigService) {
    this.queueUrls = {
      [QueueType.DEFAULT]: this.configService.getOrThrow<string>('QUEUE_URL'),
      [QueueType.MISSION]:
        this.configService.getOrThrow<string>('MISSION_QUEUE_URL'),
    };
  }

  async sendMessage(
    messageBody: object,
    type: QueueType = QueueType.DEFAULT,
  ): Promise<void> {
    const targetUrl = this.queueUrls[type];

    try {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: targetUrl,
          MessageBody: JSON.stringify(messageBody),
        }),
      );

      this.logger.log(`Message sent to ${type} queue`);
    } catch (error) {
      this.logger.warn(`SQS sendMessage to ${type} failed: ${error.message}`);
    }
  }
}
