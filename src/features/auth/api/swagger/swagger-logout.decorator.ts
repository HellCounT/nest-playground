import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function SwaggerLogout() {
  return applyDecorators(
    ApiOperation({ summary: 'User logout' }),
    ApiNoContentResponse({
      description: 'Logged out',
    }),
    ApiUnauthorizedResponse({ description: 'User unauthorized' }),
    ApiBearerAuth(),
  );
}
