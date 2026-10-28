import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity.js';
import { UserRepository } from './repository/user.repository.js';
import { UsersController } from './api/user.controller.js';
import { JwtTokenService } from '../../common/jwt/jwt-token.service.js';
import { CqrsModule } from '@nestjs/cqrs';
import { GetAllUsersHandler } from './api/queries/get-all-users.query.js';
import { PaginationUtil } from '../../common/utils/pagination.util.js';
import { MeQueryHandler } from './api/queries/my.query.js';
import { GetTopActiveUsersHandler } from './api/queries/get-top-active-users.query.js';
import { AppCacheModule } from '../../common/cache/app-cache.module.js';
import { UpdateUserProfileHandler } from './domain/commands/update-user-profile.command.js';
import { HashPasswordUtil } from '../../common/utils/hash-password.util.js';
import { TransferMoneyHandler } from './domain/commands/transfer-money.command.js';
import { MoneyMathsUtil } from '../../common/utils/money-maths.util.js';
import { MoneyTransferRepository } from '../money-transfer/repository/money-transfer.repository.js';
import { MoneyTransfer } from '../money-transfer/entity/money-transfer.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MoneyTransfer]),
    CqrsModule,
    AppCacheModule,
  ],
  controllers: [UsersController],
  providers: [
    UserRepository,
    MoneyTransferRepository,
    JwtTokenService,
    UpdateUserProfileHandler,
    TransferMoneyHandler,
    GetAllUsersHandler,
    MeQueryHandler,
    GetTopActiveUsersHandler,
    HashPasswordUtil,
    PaginationUtil,
    MoneyMathsUtil,
  ],
  exports: [UserRepository],
})
export class UserModule {}
