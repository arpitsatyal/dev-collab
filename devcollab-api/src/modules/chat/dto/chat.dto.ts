import { IsUUID } from 'class-validator';

export class ChatParamsDto {
  @IsUUID()
  chatId: string;
}
