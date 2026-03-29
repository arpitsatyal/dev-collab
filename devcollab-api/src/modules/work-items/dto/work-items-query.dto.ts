import { IsOptional, IsString } from 'class-validator';

export class GetDueSoonQueryDto {
  @IsOptional()
  @IsString()
  days?: string;
}

export class GetWorkItemsQueryDto {
  @IsString()
  workspaceId: string;
}
