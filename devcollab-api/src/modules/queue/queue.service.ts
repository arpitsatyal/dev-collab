import { Injectable, Logger } from '@nestjs/common';
import { QueuePort } from './ports/queue.port';
import { QueueProviderPort } from './ports/queue-provider.port';
import { QueueType } from './enums/queue-type.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService implements QueuePort {
  private readonly logger = new Logger(QueueService.name);
  private readonly queueUrls: Record<QueueType, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly provider: QueueProviderPort,
  ) {
    this.queueUrls = {
      [QueueType.DEFAULT]: this.configService.getOrThrow<string>('QUEUE_URL'),
      [QueueType.MISSION]: this.configService.getOrThrow<string>('MISSION_QUEUE_URL'),
    };
  }

  async sendMessage(messageBody: object, type: QueueType = QueueType.DEFAULT): Promise<void> {
    const targetUrl = this.queueUrls[type];

    try {
      await this.provider.sendRawMessage(targetUrl, JSON.stringify(messageBody));
      this.logger.log(`Message sent to ${type} queue`);
    } catch (error) {
      this.logger.warn(`Failed to send message to ${type} queue: ${error.message}`);
    }
  }
}
