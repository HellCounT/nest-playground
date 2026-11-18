import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../../session/repository/session.repository.js';
import { SessionNotFoundException } from '../../../../common/exceptions/domain-exceptions.js';
import { PinoLogger } from 'nestjs-pino';

export class LogoutUserCommand extends Command<boolean> {
  constructor(public sessionId: string) {
    super();
  }
}

@CommandHandler(LogoutUserCommand)
@Injectable()
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand> {
  constructor(
    protected sessionRepository: SessionRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LogoutUserHandler.name);
  }

  async execute(command: LogoutUserCommand): Promise<boolean> {
    this.logger.debug(
      { sessionId: command.sessionId },
      'Starting session deletion',
    );

    const existingSession = await this.sessionRepository.getById(
      command.sessionId,
    );

    if (!existingSession) {
      this.logger.warn({ sessionId: command.sessionId }, 'Session not found');
      throw new SessionNotFoundException();
    } else {
      const deletionResult = await this.sessionRepository.deleteOneById(
        existingSession.id,
      );
      this.logger.info(
        { sessionId: command.sessionId, deletionResult },
        `Session deleted with ${deletionResult} result`,
      );
      return deletionResult;
    }
  }
}
