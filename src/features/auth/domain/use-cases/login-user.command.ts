import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginInputDto } from '../../api/dto/login-input.dto.js';
import { UserRepository } from '../../../user/repository/user.repository.js';
import { HashPasswordUtil } from '../../../../common/utils/hash-password.util.js';
import { TokenPair, TokenTypes } from '../../../../common/jwt/token.types.js';
import { v4 as uuidv4 } from 'uuid';
import { JwtTokenService } from '../../../../common/jwt/jwt-token.service.js';
import { SessionRepository } from '../../../session/repository/session.repository.js';
import { SessionCreateType } from '../../../session/types/session-create.type.js';
import { DUMMY_PASSWORD_HASH } from '../../constraints/auth.constants.js';
import {
  InvalidPasswordException,
  SessionCreationFailedException,
  SessionUpdateFailedException,
  UserNotFoundException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { PinoLogger } from 'nestjs-pino';

export class LoginUserCommand extends Command<TokenPair> {
  constructor(
    public readonly loginInputDto: LoginInputDto,
    public readonly ip: string,
    public readonly deviceName: string,
  ) {
    super();
  }
}

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashPasswordUtil: HashPasswordUtil,
    private readonly jwtTokenService: JwtTokenService,
    private readonly sessionRepository: SessionRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LoginUserCommand.name);
  }

  async execute(command: LoginUserCommand): Promise<TokenPair> {
    const { login, password } = command.loginInputDto;
    const ip = command.ip;
    const deviceName = command.deviceName;

    this.logger.debug({ login }, 'Starting login');

    const existingUser = await this.userRepository.findByLogin(login);

    const passwordHash = existingUser?.passwordHash ?? DUMMY_PASSWORD_HASH;

    const isPasswordValid = await this.hashPasswordUtil.verifyPassword(
      password,
      passwordHash,
    );

    if (!existingUser) {
      this.logger.warn({ login }, 'User not found');
      throw new UserNotFoundException();
    }
    if (!isPasswordValid) {
      this.logger.warn({ login }, 'Invalid password');
      throw new InvalidPasswordException();
    }

    const createdAt = new Date().toISOString();
    const userId = existingUser.id;

    const session = await this.sessionRepository.getBySessionDetails(
      userId,
      ip,
      deviceName,
    );

    const sessionId = session?.id ?? uuidv4();

    const refreshToken = await this.jwtTokenService.createToken(
      { userId, sessionId, createdAt },
      TokenTypes.REFRESH,
    );
    const accessToken = await this.jwtTokenService.createToken(
      { userId, sessionId },
      TokenTypes.ACCESS,
    );

    if (session) {
      const isUpdated = this.sessionRepository.updateOneById(session.id, {
        refreshTokenCreationDate: createdAt,
      });
      if (!isUpdated) {
        this.logger.warn(
          { login, sessionId: session.id },
          'Failed to update session',
        );
        throw new SessionUpdateFailedException();
      }
    } else {
      const newSession: SessionCreateType = {
        id: sessionId,
        userId,
        ip,
        deviceName,
        refreshTokenCreationDate: createdAt,
        lastVisit: new Date(),
      };
      const createdSession = await this.sessionRepository.create(newSession);
      if (!createdSession) {
        this.logger.error({ login, sessionId }, 'Failed to create session');
        throw new SessionCreationFailedException();
      }
    }

    this.logger.info({ login }, 'Successfully logged in');

    return { accessToken, refreshToken };
  }
}
