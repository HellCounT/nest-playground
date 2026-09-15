import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SortDirection } from '../../../../common/utils/pagination.util.js';

export class GetAllUsersQueryParamsDto {
  @IsOptional()
  @IsString()
  searchLogin?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;
}
