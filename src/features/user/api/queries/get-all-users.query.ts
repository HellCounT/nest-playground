import { QueryHandler } from '@nestjs/cqrs';
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

export class GetAllUsersQuery {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortDirection: SortDirection,
    public readonly searchLogin?: string,
  ) {}
}

@QueryHandler(GetAllUsersQuery)
@Injectable()
export class GetAllUsersHandler {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    protected paginationUtil: PaginationUtil,
  ) {}
  async execute(query: GetAllUsersQuery): Promise<Paginated<UserOutputDto>> {
    const { page, pageSize, searchLogin, sortDirection } = query;

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

    return this.paginationUtil.getPaginatedResult(
      page,
      pageSize,
      totalCount,
      items,
    );
  }
}
