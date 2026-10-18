import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../user/repository/user.repository.js';
import {
  AvatarsMaximumAmountAchievedException,
  UserNotFoundException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { AvatarRepository } from '../../repository/avatar.repository.js';
import {
  AVATARS_FOLDER_NAME,
  MAX_AVATARS,
} from '../../constraints/avatars.constraints.js';
import { IFileService } from '../../../../providers/files/files.adapter.js';
import { v4 as uuidv4 } from 'uuid';
import { Avatar } from '../../entity/avatar.entity.js';
import { PinoLogger } from 'nestjs-pino';

export class UploadAvatarCommand extends Command<Avatar> {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}

@CommandHandler(UploadAvatarCommand)
@Injectable()
export class UploadAvatarHandler implements ICommandHandler<UploadAvatarCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly avatarRepository: AvatarRepository,
    private readonly fileService: IFileService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UploadAvatarHandler.name);
  }
  async execute(command: UploadAvatarCommand): Promise<Avatar> {
    const { userId, file } = command;

    this.logger.debug(
      { userId, fileSize: file.size },
      'Starting avatar upload',
    );

    const user = await this.userRepository.getById(userId);
    if (!user) {
      this.logger.warn({ userId }, 'Avatar upload rejected: user not found');
      throw new UserNotFoundException();
    }
    const foundAvatars = await this.avatarRepository.getUserAvatars(user.id);
    if (foundAvatars[1] >= MAX_AVATARS) {
      this.logger.warn(
        { userId, currentCount: foundAvatars.length },
        'Avatar limit exceeded',
      );
      throw new AvatarsMaximumAmountAchievedException();
    }

    const newAvatarId = uuidv4();
    await this.fileService.uploadFile({
      file,
      folder: AVATARS_FOLDER_NAME,
      name: newAvatarId,
    });

    const newAvatar = await this.avatarRepository.create({
      id: newAvatarId,
      fileName: file.originalname,
      userId: userId,
    });

    this.logger.info(
      { userId, avatarId: newAvatar.id },
      'Avatar successfully uploaded',
    );

    return newAvatar;
  }
}
