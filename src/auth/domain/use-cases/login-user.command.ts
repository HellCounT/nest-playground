import { Injectable } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { LoginInputDto } from '../../api/dto/login-input.dto.js';
import { UserRepository } from '../../../features/user/repository/user.repository.js';
import { HashPasswordUtil } from '../../../common/utils/hash-password.util.js';
import { TokenPair, TokenTypes } from '../../../common/types/token.types.js';
import { v4 as uuidv4 } from 'uuid';
import { JwtTokenService } from '../../../common/jwt-token.service.js';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { SessionCreateType } from '../../../features/session/types/session-create.type.js';
import { DUMMY_PASSWORD_HASH } from '../../constraints/auth.constants.js';
import {
  InvalidPasswordException,
  SessionCreationFailedException,
  SessionUpdateFailedException,
  UserNotFoundException,
} from '../../../common/exceptions/domain-exceptions.js';

export class LoginUserCommand {
  constructor(
    public readonly loginInputDto: LoginInputDto,
    public readonly ip: string,
    public readonly deviceName: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashPasswordUtil: HashPasswordUtil,
    private readonly jwtTokenService: JwtTokenService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: LoginUserCommand): Promise<TokenPair> {
    const { login, password } = command.loginInputDto;
    const ip = command.ip;
    const deviceName = command.deviceName;

    const existingUser = await this.userRepository.findByLogin(login);

    const passwordHash = existingUser?.passwordHash ?? DUMMY_PASSWORD_HASH;

    const isPasswordValid = await this.hashPasswordUtil.verifyPassword(
      password,
      passwordHash,
    );

    if (!existingUser) throw new UserNotFoundException();
    if (!isPasswordValid) throw new InvalidPasswordException();

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
      if (!isUpdated) throw new SessionUpdateFailedException();
    } else {
      const newSession: SessionCreateType = {
        id: sessionId,
        userId,
        ip,
        deviceName,
        refreshTokenCreationDate: createdAt,
        lastVisit: new Date(),
      };
      const createdSession = this.sessionRepository.create(newSession);
      if (!createdSession) throw new SessionCreationFailedException();
    }

    return { accessToken, refreshToken };
  }
}
