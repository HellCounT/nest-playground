import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { validationConstants } from '../../../../settings/validation.constraints.js';

export class UserUpdateProfileInputDto {
  @ApiPropertyOptional({ example: 'TeSt12345!*' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(validationConstants.PASSWORD_MIN_LENGTH, {
    message: `Minimum amount of characters: ${validationConstants.PASSWORD_MIN_LENGTH}`,
  })
  @MaxLength(validationConstants.PASSWORD_MAX_LENGTH, {
    message: `Maximum amount of characters: ${validationConstants.PASSWORD_MAX_LENGTH}`,
  })
  @Matches(new RegExp(validationConstants.PASSWORD_PATTERN), {
    message: `Password must match with the pattern ${validationConstants.PASSWORD_PATTERN}`,
  })
  password?: string;

  @ApiPropertyOptional({ example: 35 })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(14)
  @Max(120)
  @IsPositive({ message: `The age number should be positive` })
  age?: number;

  @ApiPropertyOptional({ example: 'Backend developer' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(validationConstants.DESCRIPTION_MIN_LENGTH, {
    message: `Minimum amount of characters: ${validationConstants.DESCRIPTION_MIN_LENGTH}`,
  })
  @MaxLength(validationConstants.DESCRIPTION_MAX_LENGTH, {
    message: `Maximum amount of characters: ${validationConstants.DESCRIPTION_MAX_LENGTH}{}`,
  })
  description?: string;
}
