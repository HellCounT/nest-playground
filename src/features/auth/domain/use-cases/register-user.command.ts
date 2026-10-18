import { UserRegistrationInputDto } from '../../api/dto/registration-input.dto.js';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../user/repository/user.repository.js';
import { HashPasswordUtil } from '../../../../common/utils/hash-password.util.js';
import { v4 as uuidv4 } from 'uuid';
import { UserCreateType } from '../../types/user-create.type.js';
import { UserOutputDto } from '../../../user/api/dto/user-output.dto.js';
import {
  UserAlreadyExistsException,
  UserCreationFailedException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { PinoLogger } from 'nestjs-pino';

export class RegisterUserCommand extends Command<UserOutputDto> {
  constructor(public registrationInputDto: UserRegistrationInputDto) {
    super();
  }
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    protected userRepository: UserRepository,
    protected hashPasswordUtil: HashPasswordUtil,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RegisterUserHandler.name);
  }
  async execute(command: RegisterUserCommand): Promise<UserOutputDto> {
    const { login, email, password, age, description } =
      command.registrationInputDto;

    this.logger.debug({ login }, 'Starting register user');

    const checkForExistingUserLogin =
      await this.userRepository.findByLogin(login);
    if (checkForExistingUserLogin) {
      this.logger.warn(
        { login, email },
        `User registration failed: user with login ${login} already exists`,
      );
      throw new UserAlreadyExistsException('login');
    }

    const checkForExistingUserEmail =
      await this.userRepository.findByEmail(email);
    if (checkForExistingUserEmail) {
      this.logger.warn(
        { email, login },
        `User registration failed: user with email ${email} already exists`,
      );
      throw new UserAlreadyExistsException('email');
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
    if (!createdUser) {
      this.logger.error(
        { login, email },
        'User registration failed on repository side',
      );
      throw new UserCreationFailedException();
    }

    this.logger.info({ login, email }, 'User successfully registered');

    return UserOutputDto.mapToView(createdUser);
  }
}
