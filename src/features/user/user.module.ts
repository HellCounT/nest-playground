import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity.js';
import { UserRepository } from './repository/user.repository.js';
import { UsersController } from './api/user.controller.js';
import { JwtTokenService } from '../../common/jwt-token.service.js';
import { CqrsModule } from '@nestjs/cqrs';
import { GetAllUsersHandler } from './api/queries/get-all-users.query.js';
import { PaginationUtil } from '../../common/utils/pagination.util.js';
import { MeQueryHandler } from './api/queries/my.query.js';
import { GetTopActiveUsersHandler } from './api/queries/get-top-active-users.query.js';
import { AppCacheModule } from '../../common/cache/app-cache.module.js';
import { UpdateUserProfileHandler } from './domain/commands/update-user-profile.command.js';
import { HashPasswordUtil } from '../../common/utils/hash-password.util.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CqrsModule, AppCacheModule],
  controllers: [UsersController],
  providers: [
    UserRepository,
    JwtTokenService,
    UpdateUserProfileHandler,
    GetAllUsersHandler,
    MeQueryHandler,
    GetTopActiveUsersHandler,
    HashPasswordUtil,
    PaginationUtil,
  ],
  exports: [UserRepository],
})
export class UserModule {}
