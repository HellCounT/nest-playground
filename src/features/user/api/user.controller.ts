import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { UserOutputDto } from './dto/user-output.dto.js';
import { GetAllUsersQueryParamsDto } from './dto/get-all-users-query-params.dto.js';
import { Paginated } from '../../../common/utils/pagination.util.js';
import { GetAllUsersQuery } from './queries/get-all-users.query.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import type { RefreshTokenRequest } from '../../../common/types/refresh-token-request.interface.js';
import { MeQuery } from './queries/my.query.js';

@Controller('users')
export class UsersController {
  constructor(protected queryBus: QueryBus) {}

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  async getAllUsers(
    @Query() queryParams: GetAllUsersQueryParamsDto,
  ): Promise<Paginated<UserOutputDto>> {
    return this.queryBus.execute(
      new GetAllUsersQuery(
        queryParams.page,
        queryParams.pageSize,
        queryParams.sortDirection,
        queryParams.searchLogin,
      ),
    );
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('me')
  async me(@Req() request: RefreshTokenRequest): Promise<UserOutputDto> {
    const userId = request.sessionId;
    return await this.queryBus.execute(new MeQuery(userId));
  }
}
