import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchUserQueryDto {
  @IsNotEmpty()
  @IsString()
  text: string;
}

export class CollaborationUsersQueryDto {
  @IsNotEmpty()
  userIds: string | string[];
}
