import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetDueSoonQueryDto {
  @IsOptional()
  @IsString()
  days?: string;
}

export class GetWorkItemsQueryDto {
  @IsNotEmpty()
  @IsString()
  workspaceId: string;
}
