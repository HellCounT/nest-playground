import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function SwaggerMe() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user info' }),
    ApiOkResponse({ description: 'Showed user info' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
    ApiBearerAuth(),
  );
}
