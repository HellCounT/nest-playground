import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { AvatarOutputDto } from '../../../user/api/dto/avatar-output.dto.js';

export function SwaggerUploadAvatar() {
  return applyDecorators(
    ApiOperation({ summary: 'Upload current user avatar' }),
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'JPEG or PNG image file',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Avatar successfully uploaded',
      type: AvatarOutputDto,
    }),
    ApiBadRequestResponse({
      description:
        'File is missing, exceeds maximum allowed size, or is not a valid JPEG/PNG image',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized or invalid access token',
    }),
  );
}
