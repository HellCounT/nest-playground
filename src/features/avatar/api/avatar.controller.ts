import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import type { AccessTokenRequest } from '../../../common/jwt/access-token-request.interface.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAvatarCommand } from '../domain/use-cases/upload-avatar.command.js';
import { AvatarFileValidationPipe } from './pipes/avatar-file-validation.pipe.js';
import { DeleteAvatarCommand } from '../domain/use-cases/delete-avatar.command.js';
import { AvatarOutputDto } from '../../user/api/dto/avatar-output.dto.js';
import { SwaggerUploadAvatar } from './swagger/swagger-upload-avatar.decorator.js';
import { SwaggerDeleteAvatar } from './swagger/swagger-delete-avatar.decorator.js';

@Controller('avatars')
export class AvatarController {
  constructor(protected readonly commandBus: CommandBus) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @SwaggerUploadAvatar()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() request: AccessTokenRequest,
    @UploadedFile(AvatarFileValidationPipe)
    file: Express.Multer.File,
  ) {
    const result = await this.commandBus.execute(
      new UploadAvatarCommand(request.userId, file),
    );
    return AvatarOutputDto.mapToView(result);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  @SwaggerDeleteAvatar()
  @Delete(':id')
  async deleteAvatar(
    @Req() request: AccessTokenRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.commandBus.execute(new DeleteAvatarCommand(request.userId, id));
  }
}
