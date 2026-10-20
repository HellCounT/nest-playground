import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserOutputDto } from './dto/user-output.dto.js';
import { GetAllUsersQueryParamsDto } from './dto/get-all-users-query-params.dto.js';
import { Paginated } from '../../../common/utils/pagination.util.js';
import { GetAllUsersQuery } from './queries/get-all-users.query.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { MeQuery } from './queries/my.query.js';
import type { AccessTokenRequest } from '../../../common/types/access-token-request.interface.js';
import { SwaggerGetAllUsers } from './swagger/swagger-get-all-users.decorator.js';
import { SwaggerMe } from './swagger/swagger-me.decorator.js';
import { GetTopActiveUsersQueryParamsDto } from './dto/get-top-active-users-query-params.dto.js';
import { UserWithLatestAvatarOutputDto } from './dto/user-with-latest-avatar-output.dto.js';
import { GetTopActiveUsersQuery } from './queries/get-top-active-users.query.js';
import { UserUpdateProfileInputDto } from './dto/user-update-profile-input.dto.js';
import { AtLeastOneFieldPipe } from '../../../common/pipes/at-least-one-field.pipe.js';
import { UpdateUserProfileCommand } from '../domain/commands/update-user-profile.command.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @SwaggerGetAllUsers()
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
  @Get('top')
  async getTopActiveUsers(
    @Query() queryParams: GetTopActiveUsersQueryParamsDto,
  ): Promise<Paginated<UserWithLatestAvatarOutputDto>> {
    return this.queryBus.execute(
      new GetTopActiveUsersQuery(
        queryParams.page,
        queryParams.pageSize,
        queryParams.minAge,
        queryParams.maxAge,
      ),
    );
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @SwaggerMe()
  @Get('me')
  async me(@Req() request: AccessTokenRequest): Promise<UserOutputDto> {
    const userId = request.userId;
    return await this.queryBus.execute(new MeQuery(userId));
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  //todo: SWAGGER
  @Patch('me/update')
  async updateMyProfile(
    @Req() request: AccessTokenRequest,
    @Body(AtLeastOneFieldPipe)
    userUpdateProfileInputDto: UserUpdateProfileInputDto,
  ): Promise<void> {
    const userId = request.userId;
    return await this.commandBus.execute(
      new UpdateUserProfileCommand(userId, userUpdateProfileInputDto),
    );
  }
}
