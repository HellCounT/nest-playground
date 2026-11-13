import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity.js';
import { UserOutputDto } from '../dto/user-output.dto.js';
import {
  Paginated,
  PaginationUtil,
  SortDirection,
} from '../../../../common/utils/pagination.util.js';
import { ILike, IsNull, Repository } from 'typeorm';
import { AppCacheService } from '../../../../common/cache/app-cache.service.js';
import { PinoLogger } from 'nestjs-pino';

export class GetAllUsersQuery extends Query<Paginated<UserOutputDto>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortDirection: SortDirection,
    public readonly searchLogin?: string,
  ) {
    super();
  }
}

@QueryHandler(GetAllUsersQuery)
@Injectable()
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery> {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    protected paginationUtil: PaginationUtil,
    private readonly cacheService: AppCacheService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GetAllUsersHandler.name);
  }
  async execute(query: GetAllUsersQuery): Promise<Paginated<UserOutputDto>> {
    const { page, pageSize, searchLogin, sortDirection } = query;

    const version = await this.cacheService.getUsersListVersion();

    const cacheKey =
      version === undefined
        ? undefined
        : [
            `users:list:v${version}`,
            `page=${page}`,
            `size=${pageSize}`,
            `search=${searchLogin ?? ''}`,
            `sortDirection=${sortDirection}`,
          ].join(':');

    this.logger.debug({ query }, 'GetAllUsersQuery started');

    if (cacheKey !== undefined) {
      const cachedUsers =
        await this.cacheService.get<Paginated<UserOutputDto>>(cacheKey);

      if (cachedUsers !== undefined && cachedUsers !== null) {
        this.logger.debug({ cacheKey }, 'CACHE HIT: GetAllUsersHandler');
        this.logger.info(
          {
            cacheKey,
            totalCount: cachedUsers.totalCount,
            returnedCount: cachedUsers.items.length,
            source: 'cache',
          },
          'GetAllUsersQuery completed successfully',
        );
        return cachedUsers;
      }
    }

    this.logger.debug(
      { cacheKey },
      'CACHE MISS: GetAllUsersHandler or Redis unavailable',
    );

    const [users, totalCount] = await this.usersRepository.findAndCount({
      where: {
        deletedAt: IsNull(),
        ...(searchLogin
          ? {
              login: ILike(`%${searchLogin}%`),
            }
          : {}),
      },
      skip: this.paginationUtil.getOffset(page, pageSize),
      take: pageSize,
      order: {
        createdAt: sortDirection,
      },
    });

    const items = users.map((user) => {
      return UserOutputDto.mapToView(user);
    });

    const result = this.paginationUtil.getPaginatedResult(
      page,
      pageSize,
      totalCount,
      items,
    );

    if (cacheKey !== undefined) {
      await this.cacheService.set(cacheKey, result);
      this.logger.debug({ cacheKey, query }, 'GetAllUsersQuery result cached');
    }

    this.logger.info(
      {
        cacheKey,
        totalCount,
        returnedCount: result.items.length,
        source: 'database',
      },
      'GetAllUsersQuery completed successfully',
    );

    return result;
  }
}
