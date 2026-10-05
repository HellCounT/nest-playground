import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import type { AccessTokenRequest } from '../../../common/types/access-token-request.interface.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAvatarCommand } from '../domain/use-cases/upload-avatar.command.js';
import { AvatarFileValidationPipe } from './pipes/avatar-file-validation.pipe.js';
import { DeleteAvatarCommand } from '../domain/use-cases/delete-avatar.command.js';

@Controller('avatars')
export class AvatarController {
  constructor(protected readonly commandBus: CommandBus) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() request: AccessTokenRequest,
    @UploadedFile(AvatarFileValidationPipe)
    file: Express.Multer.File,
  ) {
    return await this.commandBus.execute(
      new UploadAvatarCommand(request.userId, file),
    );
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  async deleteAvatar(
    @Req() request: AccessTokenRequest,
    @Param('id') id: string,
  ) {
    return await this.commandBus.execute(
      new DeleteAvatarCommand(request.userId, id),
    );
  }
}
