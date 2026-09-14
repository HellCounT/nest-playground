import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UserRegistrationInputDto } from './dto/registration-input.dto.js';
import { RegisterUserCommand } from '../domain/use-cases/register-user.command.js';
import { LoginInputDto } from './dto/login-input.dto.js';
import { IpUtil } from '../../common/utils/ip.util.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    protected commandBus: CommandBus,
    protected ipUtil: IpUtil,
  ) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('user-registration')
  async handleUserRegistration(
    @Body() userRegistrationInputDto: UserRegistrationInputDto,
  ) {
    return await this.commandBus.execute(
      new RegisterUserCommand(userRegistrationInputDto),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async handleLogin(
    @Body() loginInputDto: LoginInputDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const ip = this.ipUtil.getClientIp(request);
    const deviceName = request.get('user-agent');
  }
}
