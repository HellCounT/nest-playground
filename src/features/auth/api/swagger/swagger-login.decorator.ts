import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { LoginInputDto } from '../dto/login-input.dto.js';
import { AccessTokenOutputDto } from '../dto/access-token-output.dto.js';

export function SwaggerLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
    }),
    ApiBody({ type: LoginInputDto }),
    ApiOkResponse({
      description: 'Returns access token in body and refresh token in cookies',
      type: AccessTokenOutputDto,
    }),
    ApiBadRequestResponse({ description: 'Validation error occurred' }),
  );
}
