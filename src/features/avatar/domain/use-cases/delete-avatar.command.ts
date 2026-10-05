import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AvatarRepository } from '../../repository/avatar.repository.js';
import { UserRepository } from '../../../user/repository/user.repository.js';
import {
  AvatarNotFoundException,
  UnableToDeleteForeignAvatarException,
  UserNotFoundException,
} from '../../../../common/exceptions/domain-exceptions.js';

export class DeleteAvatarCommand {
  constructor(
    public readonly userId: string,
    public readonly avatarId: string,
  ) {}
}

@CommandHandler(DeleteAvatarCommand)
@Injectable()
export class DeleteAvatarHandler {
  constructor(
    private readonly avatarRepository: AvatarRepository,
    private readonly userRepository: UserRepository,
  ) {}
  async execute(command: DeleteAvatarCommand): Promise<boolean> {
    const user = await this.userRepository.getById(command.userId);
    if (!user) throw new UserNotFoundException();
    const avatar = await this.avatarRepository.getById(command.avatarId);
    if (!avatar) throw new AvatarNotFoundException();
    if (avatar.userId !== user.id)
      throw new UnableToDeleteForeignAvatarException();
    return await this.avatarRepository.deleteOneById(command.avatarId);
  }
}
