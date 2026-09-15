import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserRegistrationInputDto } from '../dto/registration-input.dto.js';
import { UserOutputDto } from '../../../features/user/api/dto/user-output.dto.js';

export function SwaggerRegisterUser() {
  return applyDecorators(
    ApiOperation({ summary: 'User registration' }),
    ApiBody({ type: UserRegistrationInputDto }),
    ApiCreatedResponse({
      description: 'User successfully registered',
      type: UserOutputDto,
    }),
    ApiBadRequestResponse({
      description: 'Validation error occurred',
    }),
  );
}
