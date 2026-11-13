import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AvatarRepository } from '../../repository/avatar.repository.js';
import { UserRepository } from '../../../user/repository/user.repository.js';
import {
  AvatarNotFoundException,
  UnableToDeleteForeignAvatarException,
  UserNotFoundException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { PinoLogger } from 'nestjs-pino';

export class DeleteAvatarCommand extends Command<boolean> {
  constructor(
    public readonly userId: string,
    public readonly avatarId: string,
  ) {
    super();
  }
}

@CommandHandler(DeleteAvatarCommand)
@Injectable()
export class DeleteAvatarHandler implements ICommandHandler<DeleteAvatarCommand> {
  constructor(
    private readonly avatarRepository: AvatarRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeleteAvatarHandler.name);
  }
  async execute(command: DeleteAvatarCommand): Promise<boolean> {
    this.logger.debug(
      { userId: command.userId, avatarId: command.avatarId },
      'Starting avatar deletion',
    );

    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      this.logger.warn(
        { userId: command.userId },
        'Avatar deletion failed: user not found',
      );
      throw new UserNotFoundException();
    }

    const avatar = await this.avatarRepository.getById(command.avatarId);
    if (!avatar) {
      this.logger.warn(
        { userId: command.userId, avatarId: command.avatarId },
        'Avatar deletion failed: avatar not found',
      );
      throw new AvatarNotFoundException();
    }

    if (avatar.userId !== user.id) {
      this.logger.warn(
        { userId: command.userId, avatarId: command.avatarId },
        'Avatar deletion failed: avatar does not belong to the user',
      );
      throw new UnableToDeleteForeignAvatarException();
    }

    const deletionResult = await this.avatarRepository.deleteOneById(
      command.avatarId,
    );

    this.logger.info(
      {
        userId: command.userId,
        avatarId: command.avatarId,
        deletionResult: deletionResult,
      },
      `Avatar deletion executed with ${deletionResult} result`,
    );

    return deletionResult;
  }
}
