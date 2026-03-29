import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchUserQueryDto {
  @IsNotEmpty()
  @IsString()
  text: string;
}

export class CollaborationUsersQueryDto {
  @IsNotEmpty()
  @Transform(({ value }: { value: any }): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return [];
  })
  userIds: string[];
}
