import { IsString } from 'class-validator';

export class DocCreateDto {
  @IsString()
  label: string;
}

export class DocUpdateDto {
  @IsString()
  content: string;
}
