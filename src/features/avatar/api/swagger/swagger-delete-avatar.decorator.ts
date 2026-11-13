import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function SwaggerDeleteAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft delete current user avatar' }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'Avatar UUID',
      type: String,
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiNoContentResponse({
      description: 'Avatar successfully marked as deleted',
    }),
    ApiBadRequestResponse({
      description: 'Invalid avatar ID or avatar not found',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized, invalid access token or user not found',
    }),
    ApiForbiddenResponse({
      description: 'Avatar does not belong to the current user',
    }),
  );
}
