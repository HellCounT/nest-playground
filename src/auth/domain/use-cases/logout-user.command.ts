import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { SessionNotFoundException } from '../../../common/exceptions/domain-exceptions.js';

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

    if (!existingSession) {
      throw new SessionNotFoundException();
    } else {
      return await this.sessionRepository.deleteOneById(existingSession.id);
    }
  }
}
