import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AskDto {
  @IsOptional()
  @IsUUID()
  chatId?: string;

  @IsString()
  @MaxLength(4000)
  question: string;
}
