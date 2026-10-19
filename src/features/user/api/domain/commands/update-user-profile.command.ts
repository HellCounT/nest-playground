import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserUpdateProfileInputDto } from '../../dto/user-update-profile-input.dto.js';
import { UserRepository } from '../../../repository/user.repository.js';
import { HashPasswordUtil } from '../../../../../common/utils/hash-password.util.js';
import { PinoLogger } from 'nestjs-pino';
import { UserUpdateInfoType } from '../../../../auth/types/user-update-info.type.js';
import { UserNotFoundException } from '../../../../../common/exceptions/domain-exceptions.js';

export class UpdateUserProfileCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly updateUserProfileInputDto: UserUpdateProfileInputDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileCommandHandler implements ICommandHandler<UpdateUserProfileCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashPasswordUtil: HashPasswordUtil,
    private readonly logger: PinoLogger,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<void> {
    this.logger.debug(
      { userId: command.userId },
      'Starting user profile update',
    );

    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      this.logger.warn(
        { userId: command.userId },
        'User profile update failed: user not found',
      );
      throw new UserNotFoundException();
    }

    let userUpdateInfo: UserUpdateInfoType = {};

    let passwordHash: string;

    if (command.updateUserProfileInputDto.password) {
      passwordHash = await this.hashPasswordUtil.generateHash(
        command.updateUserProfileInputDto.password,
      );
      userUpdateInfo.hash = passwordHash;
    }

    if (command.updateUserProfileInputDto.age)
      userUpdateInfo.age = command.updateUserProfileInputDto.age;

    if (command.updateUserProfileInputDto.description)
      userUpdateInfo.description =
        command.updateUserProfileInputDto.description;

    this.logger.debug({ userUpdateInfo }, 'Collected user profile update info');

    const updateResult = await this.userRepository.updateOneById(
      command.userId,
      userUpdateInfo,
    );

    this.logger.info(
      {
        userId: command.userId,
        updateInfo: userUpdateInfo,
        updateResult: updateResult,
      },
      `User profile update executed with ${updateResult} result`,
    );
  }
}
