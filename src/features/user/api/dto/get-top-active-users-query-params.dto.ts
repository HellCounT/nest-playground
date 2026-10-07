import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTopActiveUsersQueryParamsDto {
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
    description: 'Minimum age',
    example: 18,
    default: 14,
    minimum: 14,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(14)
  @Max(120)
  minAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum age',
    example: 55,
    default: 120,
    maximum: 120,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(14)
  @Max(120)
  maxAge?: number;
}
