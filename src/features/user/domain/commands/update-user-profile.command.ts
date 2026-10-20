import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserUpdateProfileInputDto } from '../../api/dto/user-update-profile-input.dto.js';
import { UserRepository } from '../../repository/user.repository.js';
import { HashPasswordUtil } from '../../../../common/utils/hash-password.util.js';
import { PinoLogger } from 'nestjs-pino';
import { UserUpdateInfoType } from '../../../auth/types/user-update-info.type.js';
import { UserNotFoundException } from '../../../../common/exceptions/domain-exceptions.js';
import { AppCacheService } from '../../../../common/cache/app-cache.service.js';

export class UpdateUserProfileCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly updateUserProfileInputDto: UserUpdateProfileInputDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler implements ICommandHandler<UpdateUserProfileCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashPasswordUtil: HashPasswordUtil,
    private readonly cacheService: AppCacheService,
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

    const { age, description, password } = command.updateUserProfileInputDto;

    let userUpdateInfo: UserUpdateInfoType = {};

    if (password !== undefined) {
      userUpdateInfo.hash = await this.hashPasswordUtil.generateHash(password);
    }

    if (age !== undefined) {
    }
    userUpdateInfo.age = age;

    if (description !== undefined) {
    }
    userUpdateInfo.description = description;

    if (Object.keys(userUpdateInfo).length === 0) {
      return;
    }

    const updateResult = await this.userRepository.updateOneById(
      command.userId,
      userUpdateInfo,
    );

    if (updateResult) {
      const shouldInvalidateCache =
        (userUpdateInfo.age !== undefined && userUpdateInfo.age !== user.age) ||
        (userUpdateInfo.description !== undefined &&
          userUpdateInfo.description !== user.description);

      if (shouldInvalidateCache) {
        const cacheKey = `users:profile:${command.userId}`;
        await this.cacheService.delete(cacheKey);
        this.logger.debug({ cacheKey }, 'User profile cache invalidated');
        await this.cacheService.invalidateUsersLists();
        this.logger.debug('User lists cache version incremented');
      }
    }

    this.logger.info(
      {
        userId: command.userId,
        updatedFields: Object.keys(userUpdateInfo),
      },
      `User profile update executed with ${updateResult} result`,
    );

    return;
  }
}
