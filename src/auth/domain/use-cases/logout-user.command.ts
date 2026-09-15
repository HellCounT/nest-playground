import { CommandHandler } from '@nestjs/cqrs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { ErrorObjectFactory } from '../../../common/utils/error-object.factory.js';

export class LogoutUserCommand {
  constructor(public sessionId: string) {}
}

@CommandHandler(LogoutUserCommand)
@Injectable()
export class LogoutUserHandler {
  constructor(protected sessionRepository: SessionRepository) {}

  async execute(command: LogoutUserCommand): Promise<boolean> {
    const existingSession = await this.sessionRepository.getById(
      command.sessionId,
    );

    if (existingSession) {
      return await this.sessionRepository.deleteOneById(existingSession.id);
    } else {
      throw new UnauthorizedException(
        ErrorObjectFactory.createError('Session does not exist'),
      );
    }
  }
}
