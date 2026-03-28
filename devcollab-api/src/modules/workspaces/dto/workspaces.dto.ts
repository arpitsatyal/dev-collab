import {
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;
}

export class ImportRepositoryDto {
  @IsUrl()
  url: string;

  @IsArray()
  @ArrayNotEmpty()
  selectedFiles: string[];
}
