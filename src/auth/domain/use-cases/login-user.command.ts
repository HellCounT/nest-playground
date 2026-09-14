import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { LoginInputDto } from '../../api/dto/login-input.dto.js';
import { UserRepository } from '../../../features/user/repository/user.repository.js';
import { HashPasswordUtil } from '../../../common/utils/hash-password.util.js';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  TokenTypes,
} from '../../types/token.types.js';
import { ErrorObjectFactory } from '../../../common/utils/error-object.factory.js';
import { v4 as uuidv4 } from 'uuid';
import { JwtTokenService } from '../../../common/jwt-token.service.js';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { SessionCreateType } from '../../../features/session/types/session-create.type.js';

export class LoginUserCommand {
  constructor(
    public loginInputDto: LoginInputDto,
    public ip: string,
    public deviceName: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
@Injectable()
export class LoginUserHandler {
  constructor(
    protected userRepository: UserRepository,
    protected hashPasswordUtil: HashPasswordUtil,
    protected jwtTokenService: JwtTokenService,
    protected sessionRepository: SessionRepository,
  ) {}

  async execute(command: LoginUserCommand): Promise<TokenPair> {
    const { login, password } = command.loginInputDto;
    const ip = command.ip;
    const deviceName = command.deviceName;

    const existingUser = await this.userRepository.findByLogin(login);

    if (!existingUser) {
      throw new BadRequestException(
        ErrorObjectFactory.createError('User does not exist', 'login'),
      );
    }

    const isPasswordValid = await this.hashPasswordUtil.verifyPassword(
      password,
      existingUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password', 'password');
    }

    const sessionId = uuidv4();
    const createdAt = new Date().toISOString();
    const userId = existingUser.id;

    const refreshToken: string | null = await this.jwtTokenService.createToken(
      { userId, sessionId, createdAt } as RefreshTokenPayload,
      TokenTypes.REFRESH,
    );

    if (!refreshToken) {
      throw new InternalServerErrorException(
        ErrorObjectFactory.createError(
          'Some error occurred on refresh token creation',
        ),
      );
    }

    const accessToken: string | null = await this.jwtTokenService.createToken(
      { userId, sessionId } as AccessTokenPayload,
      TokenTypes.ACCESS,
    );

    if (!accessToken) {
      throw new InternalServerErrorException(
        ErrorObjectFactory.createError(
          'Some error occurred on access token creation',
        ),
      );
    }

    const session = await this.sessionRepository.getBySessionDetails(
      userId,
      ip,
      deviceName,
    );

    if (session) {
      await this.sessionRepository.updateOneById(session.id, {
        refreshTokenCreationDate: createdAt,
      });
    } else {
      const newSession: SessionCreateType = {
        id: sessionId,
        userId,
        ip,
        deviceName,
        refreshTokenCreationDate: createdAt,
        lastVisit: new Date(),
      };
      await this.sessionRepository.create(newSession);
    }

    return { accessToken, refreshToken } as TokenPair;
  }
}
