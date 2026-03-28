import { IsOptional, IsNumberString } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsNumberString()
  skip?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
