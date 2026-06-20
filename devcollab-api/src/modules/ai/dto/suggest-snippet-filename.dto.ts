import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SuggestSnippetFilenameDto {
  @IsNotEmpty()
  @IsString()
  workspaceId: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  language?: string;
}
