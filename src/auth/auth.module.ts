import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller.js';
import { RegisterUserHandler } from './domain/use-cases/register-user.command.js';
import { UserModule } from '../features/user/user.module.js';
import { LoginUserHandler } from './domain/use-cases/login-user.command.js';
import { LogoutUserHandler } from './domain/use-cases/logout-user.command.js';
import { RefreshTokenHandler } from './domain/use-cases/refresh-token.command.js';
import { SessionRepository } from '../features/session/repository/session.repository.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../features/session/entity/session.entity.js';
import { HashPasswordUtil } from '../common/utils/hash-password.util.js';
import { JwtTokenService } from '../common/jwt-token.service.js';
import { CqrsModule } from '@nestjs/cqrs';
import { IpUtil } from '../common/utils/ip.util.js';

const commandHandlers = [
  RegisterUserHandler,
  LoginUserHandler,
  LogoutUserHandler,
  RefreshTokenHandler,
];

const utils = [HashPasswordUtil, IpUtil];

const repositories = [SessionRepository];

const services = [JwtTokenService];

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Session]), CqrsModule],
  controllers: [AuthController],
  providers: [...commandHandlers, ...services, ...repositories, ...utils],
})
export class AuthModule {}
