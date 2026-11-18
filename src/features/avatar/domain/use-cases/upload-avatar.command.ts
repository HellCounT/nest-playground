import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
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
import {
  type ITransactionManager,
  TRANSACTION_MANAGER,
} from '../../../../base/infrastructure/repository/transaction-manager.interface.js';

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
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: ITransactionManager,
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

    const newAvatarId = uuidv4();
    const uploadedFile = await this.fileService.uploadFile({
      file,
      folder: AVATARS_FOLDER_NAME,
      name: newAvatarId,
    });

    try {
      const newAvatar = await this.transactionManager.run(async () => {
        const user = await this.userRepository.getByIdForUpdate(userId);

        if (!user) {
          this.logger.warn(
            { userId },
            'Avatar upload rejected: user not found',
          );
          throw new UserNotFoundException();
        }

        const [, count] = await this.avatarRepository.getUserAvatars(user.id);

        if (count >= MAX_AVATARS) {
          this.logger.warn(
            { userId, currentCount: count },
            'Avatar limit exceeded',
          );
          throw new AvatarsMaximumAmountAchievedException();
        }

        return await this.avatarRepository.create({
          id: newAvatarId,
          fileName: uploadedFile.path,
          userId: userId,
        });
      });

      this.logger.info(
        { userId, avatarId: newAvatar.id },
        'Avatar successfully uploaded',
      );

      return newAvatar;
    } catch (error) {
      this.logger.error(
        { err: error, userId, avatarId: newAvatarId },
        'Avatar entry creation failed, removing uploaded file',
      );
      try {
        await this.fileService.removeFile({ path: uploadedFile.path });
      } catch (cleanupError) {
        this.logger.error(
          { err: cleanupError, fileName: uploadedFile.path },
          'Failed to remove uploaded file after transaction failure',
        );
      }

      throw error;
    }
  }
}
