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

@Module({
  imports: [TypeOrmModule.forFeature([User]), CqrsModule],
  controllers: [UsersController],
  providers: [
    UserRepository,
    JwtTokenService,
    GetAllUsersHandler,
    MeQueryHandler,
    PaginationUtil,
  ],
  exports: [UserRepository],
})
export class UserModule {}
