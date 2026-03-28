import { IsBoolean, IsString } from 'class-validator';

export class MesssageCreateDto {
  @IsString()
  content: string;

  @IsBoolean()
  isUser: boolean;
}
