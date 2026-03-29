import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  question: string;
}
