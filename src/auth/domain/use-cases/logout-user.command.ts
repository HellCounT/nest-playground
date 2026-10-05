import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../../features/session/repository/session.repository.js';
import { SessionNotFoundException } from '../../../common/exceptions/domain-exceptions.js';

export class LogoutUserCommand extends Command<boolean> {
  constructor(public sessionId: string) {
    super();
  }
}

@CommandHandler(LogoutUserCommand)
@Injectable()
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand> {
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
