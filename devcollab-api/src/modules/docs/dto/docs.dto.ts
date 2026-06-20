import { IsString, IsOptional } from 'class-validator';

export class DocCreateDto {
  @IsString()
  label: string;

  @IsOptional()
  content?: any;
}

export class DocUpdateDto {
  @IsString()
  content: string;
}
