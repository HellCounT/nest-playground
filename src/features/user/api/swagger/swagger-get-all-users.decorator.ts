import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function SwaggerGetAllUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all users' }),
    ApiOkResponse({ description: 'Showed all users for authorized user' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
    ApiBearerAuth(),
  );
}
