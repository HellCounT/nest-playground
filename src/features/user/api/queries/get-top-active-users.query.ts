import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { User } from '../../entity/user.entity.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Paginated,
  PaginationUtil,
} from '../../../../common/utils/pagination.util.js';
import { Avatar } from '../../../avatar/entity/avatar.entity.js';
import {
  UserWithLatestAvatar,
  UserWithLatestAvatarOutputDto,
} from '../dto/user-with-latest-avatar-output.dto.js';

export class GetTopActiveUsersQuery extends Query<
  Paginated<UserWithLatestAvatarOutputDto>
> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly minAge: number,
    public readonly maxAge: number,
  ) {
    super();
  }
}

@QueryHandler(GetTopActiveUsersQuery)
@Injectable()
export class GetTopActiveUsersHandler implements IQueryHandler<GetTopActiveUsersQuery> {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Avatar)
    protected paginationUtil: PaginationUtil,
  ) {}
  async execute(
    query: GetTopActiveUsersQuery,
  ): Promise<Paginated<UserWithLatestAvatarOutputDto>> {
    const { page, pageSize, minAge, maxAge } = query;
    // Есть хотя бы 3-я аватарка
    const activeAvatarsCountQuery = `
  EXISTS (
    SELECT 1
    FROM avatar
    WHERE avatar."userId" = user.id
      AND avatar."deletedAt" IS NULL
    OFFSET 2
    LIMIT 1
  )
`;
    // Запрос полследней загруженной активной аватарки
    const latestAvatarQuery = `
  latestAvatar.id = (
    SELECT avatar.id
    FROM avatar avatar
    WHERE avatar."userId" = user.id
      AND avatar."deletedAt" IS NULL
    ORDER BY avatar."createdAt" DESC
    LIMIT 1
  )
`;

    const [users, totalCount] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndMapOne(
        `user.latestAvatar`,
        Avatar,
        'latestAvatar',
        latestAvatarQuery,
      )
      .select([
        'user.id',
        'user.login',
        'user.email',
        'user.age',
        'user.description',
        'user.createdAt',

        'latestAvatar.id',
        'latestAvatar.fileName',
        'latestAvatar.createdAt',
      ])
      .where("TRIM(user.description) <> ''")
      .andWhere('user.age BETWEEN :minAge AND :maxAge', { minAge, maxAge })
      .andWhere(activeAvatarsCountQuery)
      .skip(this.paginationUtil.getOffset(page, pageSize))
      .take(pageSize)
      .getManyAndCount();

    const usersOutput = users.map((u) =>
      UserWithLatestAvatarOutputDto.mapToView(u as UserWithLatestAvatar),
    );

    return this.paginationUtil.getPaginatedResult(
      page,
      pageSize,
      totalCount,
      usersOutput,
    );
  }
}
