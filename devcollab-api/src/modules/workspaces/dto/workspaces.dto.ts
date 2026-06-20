import {
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ImportRepositoryDto {
  @IsUrl()
  url: string;

  @IsArray()
  @ArrayNotEmpty()
  selectedFiles: string[];
}

export class RepoTreeQueryDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class TogglePinDto {
  @IsBoolean()
  @IsNotEmpty()
  isPinned: boolean;
}
