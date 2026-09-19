import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { JwtTokenService } from '../../../common/jwt-token.service.js';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { TokenPair, TokenTypes } from '../../../common/types/token.types.js';
import {
  SessionNotFoundException,
  SessionUpdateFailedException,
} from '../../../common/exceptions/domain-exceptions.js';

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
      throw new SessionNotFoundException();
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

    const accessToken = await this.jwtTokenService.createToken(
      { userId: session.userId, sessionId: command.sessionId },
      TokenTypes.ACCESS,
    );

    const isUpdated = await this.sessionRepository.updateOneById(
      command.sessionId,
      {
        refreshTokenCreationDate: newRefreshTokenCreationDate,
      },
    );

    if (!isUpdated) throw new SessionUpdateFailedException();

    return { accessToken, refreshToken };
  }
}
