import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller.js';
import { RegisterUserHandler } from './domain/use-cases/register-user.command.js';
import { UserModule } from '../features/user/user.module.js';

const commandHandlers = [RegisterUserHandler];

@Module({ imports: [UserModule], controllers: [AuthController], providers: [] })
export class AuthModule {}
