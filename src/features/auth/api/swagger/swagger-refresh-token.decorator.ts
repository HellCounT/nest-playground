import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AccessTokenOutputDto } from '../dto/access-token-output.dto.js';

export function SwaggerRefreshToken() {
  return applyDecorators(
    ApiOperation({ summary: 'Tokens pair rotation' }),
    ApiOkResponse({
      description: 'New tokens pair emission',
      type: AccessTokenOutputDto,
    }),
    ApiBearerAuth(),
  );
}
