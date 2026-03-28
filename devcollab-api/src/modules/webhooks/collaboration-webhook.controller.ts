import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CollaborationWebhookService } from './collaboration-webhook.service';
import { CollaborationWebhookDto } from 'src/modules/collaboration/dto/webhook.dto';

@Controller('webhooks/collaboration')
export class CollaborationWebhookController {
  constructor(
    private readonly webhookService: CollaborationWebhookService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Body() payload: CollaborationWebhookDto) {
    return this.webhookService.handleWebhook(payload);
  }
}
