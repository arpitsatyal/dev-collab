import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskBodyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  question: string;
}
