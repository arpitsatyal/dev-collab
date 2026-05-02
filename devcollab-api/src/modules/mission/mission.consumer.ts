import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { MissionRunnerService } from './services/mission-runner.service';

@Injectable()
export class MissionConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MissionConsumer.name);
  private readonly sqsClient = new SQSClient({ region: 'us-east-2' });
  private readonly queueUrl: string;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly missionRunner: MissionRunnerService,
  ) {
    this.queueUrl = this.configService.getOrThrow<string>('MISSION_QUEUE_URL');
  }

  onModuleInit() {
    this.isRunning = true;
    this.pollMessages();
    this.logger.log('Mission SQS Consumer started polling.');
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
          this.logger.error(`Error polling SQS: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Backoff
        }
      }
    }
  }

  private async processMessage(message: any) {
    try {
      const body = JSON.parse(message.Body);

      if (body.type === 'RUN_MISSION') {
        this.logger.log(`Worker picked up mission: ${body.missionId}`);
        await this.missionRunner.executeMission(body.missionId);
      }

      // Delete message after processing
      await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (error) {
      this.logger.error(`Error processing SQS message: ${error.message}`);
    }
  }
}
