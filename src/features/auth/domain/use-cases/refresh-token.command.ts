import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { JwtTokenService } from '../../../../common/jwt-token.service.js';
import { SessionRepository } from '../../../session/repository/session.repository.js';
import { TokenPair, TokenTypes } from '../../../../common/types/token.types.js';
import {
  SessionNotFoundException,
  SessionUpdateFailedException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { PinoLogger } from 'nestjs-pino';

export class RefreshTokenCommand extends Command<TokenPair> {
  constructor(
    public sessionId: string,
    public refreshTokenCreationDate: string,
  ) {
    super();
  }
}

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    protected jwtTokenService: JwtTokenService,
    protected sessionRepository: SessionRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RefreshTokenHandler.name);
  }

  async execute(command: RefreshTokenCommand): Promise<TokenPair> {
    this.logger.debug(
      { sessionId: command.sessionId },
      'Starting new tokens pair creation',
    );

    const session = await this.sessionRepository.getById(command.sessionId);
    if (
      !session ||
      session.refreshTokenCreationDate !== command.refreshTokenCreationDate
    ) {
      this.logger.warn(
        { sessionId: command.sessionId },
        'Tokens pair creation failed: session not found',
      );
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

    if (!isUpdated) {
      this.logger.error(
        { sessionId: command.sessionId },
        'Tokens pair creation failed: Failed to update session',
      );
      throw new SessionUpdateFailedException();
    }

    this.logger.info(
      { sessionId: command.sessionId, isUpdated },
      'Successfully updated tokens pair',
    );
    return { accessToken, refreshToken };
  }
}
