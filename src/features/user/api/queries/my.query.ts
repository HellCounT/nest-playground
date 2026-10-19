import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity.js';
import { Repository } from 'typeorm';
import { UserOutputDto } from '../dto/user-output.dto.js';
import { UserNotFoundException } from '../../../../common/exceptions/domain-exceptions.js';
import { AppCacheService } from '../../../../common/cache/app-cache.service.js';
import { PinoLogger } from 'nestjs-pino';

export class MeQuery extends Query<UserOutputDto> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(MeQuery)
@Injectable()
export class MeQueryHandler implements IQueryHandler<MeQuery> {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly cacheService: AppCacheService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MeQueryHandler.name);
  }
  async execute(query: MeQuery): Promise<UserOutputDto> {
    const cacheKey = `users:profile:${query.userId}`;

    this.logger.debug({ userId: query.userId }, 'MeQuery started');

    const cachedUser = await this.cacheService.get<UserOutputDto>(cacheKey);

    if (cachedUser !== undefined && cachedUser !== null) {
      this.logger.debug({ cacheKey }, 'CACHE HIT: MeQuery');
      this.logger.info({ cachedUser }, 'MeQuery completed successfully');
      return cachedUser;
    }

    this.logger.debug({ cacheKey }, 'CACHE MISS: MeQuery');

    const user = await this.usersRepository.findOneBy({ id: query.userId });
    if (!user) {
      this.logger.warn(
        { userId: query.userId },
        'MeQuery failed: user not found',
      );
      throw new UserNotFoundException();
    } else {
      const userDto = UserOutputDto.mapToView(user);
      await this.cacheService.set(cacheKey, userDto);
      this.logger.debug({ cacheKey, userDto }, 'MeQuery output cached');
      this.logger.info({ userDto }, 'MeQuery completed successfully');
      return userDto;
    }
  }
}
