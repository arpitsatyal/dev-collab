import {
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

export abstract class BaseSqsConsumer implements OnModuleInit, OnModuleDestroy {
  protected abstract readonly logger: Logger;
  protected abstract readonly queueUrl: string;
  private isRunning = false;
  private readonly sqsClient = new SQSClient({ region: 'us-east-2' });

  /**
   * The core logic for processing a message body.
   * To be implemented by subclasses.
   */
  protected abstract handleMessage(body: any): Promise<void>;

  onModuleInit() {
    this.isRunning = true;
    this.pollMessages();
    this.logger.log(`SQS Consumer started polling for: ${this.queueUrl}`);
  }

  onModuleDestroy() {
    this.isRunning = false;
  }

  private async pollMessages() {
    while (this.isRunning) {
      try {
        const response = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20, // Long polling
          }),
        );

        if (response.Messages) {
          for (const message of response.Messages) {
            await this.processMessage(message);
          }
        }
      } catch (error) {
        if (this.isRunning) {
          this.logger.error(`Error polling SQS (${this.queueUrl}): ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Backoff
        }
      }
    }
  }

  private async processMessage(message: any) {
    try {
      const body = JSON.parse(message.Body);
      
      await this.handleMessage(body);

      // Delete message after successful processing
      await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (error) {
      this.logger.error(`Error processing SQS message from ${this.queueUrl}: ${error.message}`);
    }
  }
}
