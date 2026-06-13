import { IsOptional, IsString } from 'class-validator';

export class CollaborationUserDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  image: string;
}
