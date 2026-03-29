import { IsObject, IsString, IsOptional } from 'class-validator';

export class CollaborationWebhookDto {
  @IsString()
  type: string;

  @IsObject()
  data: Record<string, any>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
