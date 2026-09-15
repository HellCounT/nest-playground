import { UserRegistrationInputDto } from '../../api/dto/registration-input.dto.js';
import { CommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../features/user/repository/user.repository.js';
import { HashPasswordUtil } from '../../../common/utils/hash-password.util.js';
import { User } from '../../../features/user/entity/user.entity.js';
import { BadRequestException } from '@nestjs/common';
import { ErrorObjectFactory } from '../../../common/utils/error-object.factory.js';
import { v4 as uuidv4 } from 'uuid';
import { UserCreateType } from '../../types/user-create.type.js';
import { UserOutputDto } from '../../../features/user/api/dto/user-output.dto.js';

export class RegisterUserCommand {
  constructor(public registrationInputDto: UserRegistrationInputDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler {
  constructor(
    protected userRepository: UserRepository,
    protected hashPasswordUtil: HashPasswordUtil,
  ) {}
  async execute(command: RegisterUserCommand): Promise<UserOutputDto | null> {
    const { login, email, password, age, description } =
      command.registrationInputDto;
    const checkForExistingUserLogin =
      await this.userRepository.findByLogin(login);
    if (checkForExistingUserLogin) {
      throw new BadRequestException(
        ErrorObjectFactory.createError(`Invalid login value`, `login`),
      );
    }
    const checkForExistingUserEmail =
      await this.userRepository.findByEmail(email);
    if (checkForExistingUserEmail) {
      throw new BadRequestException(
        ErrorObjectFactory.createError(`Invalid email value`, `email`),
      );
    }
    const passwordHash = await this.hashPasswordUtil.generateHash(password);
    const id = uuidv4();
    const newUser: UserCreateType = {
      id,
      login,
      email,
      passwordHash,
      age,
      description,
    };
    const createdUser = await this.userRepository.create(newUser);
    if (createdUser) {
      return UserOutputDto.mapToView(createdUser);
    } else {
      return null;
    }
  }
}
