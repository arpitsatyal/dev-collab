import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WorkItemStatus,
  workItemStatusValues,
} from 'src/common/drizzle/schema';

export class WorkItemCreateDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(workItemStatusValues)
  status?: WorkItemStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  snippetIds?: string[];
}

export class WorkItemUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(workItemStatusValues)
  status?: WorkItemStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  snippetIds?: string[];
}

export class WorkItemUpdateStatusDto {
  @IsEnum(workItemStatusValues)
  status: WorkItemStatus;
}
