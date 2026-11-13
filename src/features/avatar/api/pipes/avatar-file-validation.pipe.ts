import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE,
} from '../../constraints/avatars.constraints.js';
import { fileTypeFromBuffer } from 'file-type';

@Injectable()
export class AvatarFileValidationPipe implements PipeTransform {
  public async transform(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('File is not provided');
    }
    if (file.size > AVATAR_MAX_SIZE) {
      throw new BadRequestException(
        `Maximum file size is ${AVATAR_MAX_SIZE} bytes`,
      );
    }

    const detectedFileType = await fileTypeFromBuffer(file.buffer);

    if (
      !detectedFileType ||
      !AVATAR_ALLOWED_MIME_TYPES.includes(detectedFileType.mime)
    ) {
      throw new BadRequestException('Only JPEG and PNG files are allowed');
    }

    return file;
  }
}
