import { CommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from '../../../common/jwt-token.service.js';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { ErrorObjectFactory } from '../../../common/utils/error-object.factory.js';
import { TokenPair, TokenTypes } from '../../../common/types/token.types.js';

export class RefreshTokenCommand {
  constructor(
    public sessionId: string,
    public refreshTokenCreationDate: string,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenHandler {
  constructor(
    protected jwtTokenService: JwtTokenService,
    protected sessionRepository: SessionRepository,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenPair> {
    const session = await this.sessionRepository.getById(command.sessionId);
    if (
      !session ||
      session.refreshTokenCreationDate !== command.refreshTokenCreationDate
    ) {
      throw new UnauthorizedException(
        ErrorObjectFactory.createError('Unauthorized session ID'),
      );
    }

    const newRefreshTokenCreationDate = new Date().toISOString();

    const refreshToken = await this.jwtTokenService.createToken(
      {
        userId: session.userId,
        sessionId: command.sessionId,
        createdAt: newRefreshTokenCreationDate,
      },
      TokenTypes.REFRESH,
    );

    if (!refreshToken) {
      throw new InternalServerErrorException(
        ErrorObjectFactory.createError(
          'Some error occurred on refresh token creation',
        ),
      );
    }

    const accessToken = await this.jwtTokenService.createToken(
      { userId: session.userId, sessionId: command.sessionId },
      TokenTypes.ACCESS,
    );

    if (!accessToken) {
      throw new InternalServerErrorException(
        ErrorObjectFactory.createError(
          'Some error occurred on access token creation',
        ),
      );
    }

    await this.sessionRepository.updateOneById(command.sessionId, {
      refreshTokenCreationDate: newRefreshTokenCreationDate,
    });

    return { accessToken, refreshToken };
  }
}
