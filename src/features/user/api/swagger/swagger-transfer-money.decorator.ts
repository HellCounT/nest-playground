import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { TransferMoneyInputDto } from '../dto/transfer-money-input.dto.js';

export function SwaggerTransferMoney() {
  return applyDecorators(
    ApiOperation({ summary: 'Transfer money to another user' }),
    ApiBearerAuth(),
    ApiHeader({
      name: 'idempotency-key',
      description: 'Unique UUID v4 key to prevent duplicate transfers',
      required: true,
      schema: {
        type: 'string',
        format: 'uuid',
        example: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
      },
    }),
    ApiBody({
      type: TransferMoneyInputDto,
    }),
    ApiNoContentResponse({
      description: 'Money successfully transferred',
    }),
    ApiBadRequestResponse({
      description: 'Validation error, invalid amount or idempotency key',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized or invalid access token',
    }),
    ApiConflictResponse({
      description:
        'Insufficient funds or idempotency key already used for a different transfer',
    }),
  );
}
