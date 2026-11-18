import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { UserUpdateProfileInputDto } from '../dto/user-update-profile-input.dto.js';

export function SwaggerUpdateMyProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Update current user profile' }),
    ApiBearerAuth(),
    ApiBody({
      type: UserUpdateProfileInputDto,
      description: 'At least one field must be provided',
    }),
    ApiNoContentResponse({
      description: 'User profile successfully updated',
    }),
    ApiBadRequestResponse({
      description: 'Validation error or no fields provided',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized or invalid access token',
    }),
  );
}
