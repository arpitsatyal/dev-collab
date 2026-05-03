import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MissionRunnerService } from './services/mission-runner.service';
import { BaseSqsConsumer } from 'src/modules/queue/base-sqs.consumer';

@Injectable()
export class MissionConsumer extends BaseSqsConsumer {
  protected readonly logger = new Logger(MissionConsumer.name);
  protected readonly queueUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly missionRunner: MissionRunnerService,
  ) {
    super();
    this.queueUrl = this.configService.getOrThrow<string>('MISSION_QUEUE_URL');
  }

  protected async handleMessage(body: any) {
    if (body.type === 'RUN_MISSION') {
      this.logger.log(`Worker picked up mission: ${body.missionId}`);
      await this.missionRunner.executeMission(body.missionId);
    }
  }
}
