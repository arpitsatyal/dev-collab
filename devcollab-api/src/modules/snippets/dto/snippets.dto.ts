import { IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class SnippetsCreateDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(30)
  language: string;

  @IsString()
  @MaxLength(50000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  extension?: string;
}

export class SnippetsUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  extension?: string;

  @IsOptional()
  @IsUUID()
  lastEditedById?: string;
}
