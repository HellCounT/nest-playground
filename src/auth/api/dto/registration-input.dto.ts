import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { validationConstants } from '../../../settings/validation.constraints.js';
import { ApiProperty } from '@nestjs/swagger';

export class UserRegistrationInputDto {
  @ApiProperty({ example: 'andy258!' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(validationConstants.LOGIN_MIN_LENGTH, {
    message: `Minimum amount of characters: ${validationConstants.LOGIN_MIN_LENGTH}`,
  })
  @MaxLength(validationConstants.LOGIN_MAX_LENGTH, {
    message: `Maximum amount of characters: ${validationConstants.LOGIN_MAX_LENGTH}`,
  })
  @Matches(new RegExp(validationConstants.LOGIN_PATTERN), {
    message: 'Login value can only contain: 0-9; A-Z; a-z; _ ; -;',
  })
  login: string;

  @ApiProperty({ example: 'apitest@apitest.com' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'TeSt12345!*' })
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
  password: string;

  @ApiProperty({ example: 35 })
  @IsInt()
  @IsNotEmpty()
  @IsPositive({ message: `The age number should be positive` })
  age: number;

  @ApiProperty({ example: 'Backend developer' })
  @IsString()
  @IsNotEmpty()
  @MinLength(validationConstants.DESCRIPTION_MIN_LENGTH, {
    message: `Minimum amount of characters: ${validationConstants.DESCRIPTION_MIN_LENGTH}`,
  })
  @MaxLength(validationConstants.DESCRIPTION_MAX_LENGTH, {
    message: `Maximum amount of characters: ${validationConstants.DESCRIPTION_MAX_LENGTH}{}`,
  })
  description: string;
}
