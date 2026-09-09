import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { validationConstants } from '../../../settings/validation.constraints.js';

export class LoginInputDto {
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
  @Matches(
    new RegExp(validationConstants.PASSWORD_PATTERN),

    {
      message: `Password must match with the pattern ${validationConstants.PASSWORD_PATTERN}`,
    },
  )
  password: string;
}
