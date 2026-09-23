import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SortDirection } from '../../../../common/utils/pagination.util.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAllUsersQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Search users by login',
    example: 'andy',
  })
  @IsString()
  @IsOptional()
  @IsOptional()
  @IsString()
  searchLogin?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @ApiPropertyOptional({
    description: 'Sort direction by creation date',
    enum: SortDirection,
    example: SortDirection.DESC,
    default: SortDirection.DESC,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;
}
