import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UserRegistrationInputDto } from './dto/registration-input.dto.js';
import { RegisterUserCommand } from '../domain/use-cases/register-user.command.js';
import { LoginInputDto } from './dto/login-input.dto.js';
import { IpUtil } from '../../common/utils/ip.util.js';
import type { Request, Response } from 'express';
import { LoginUserCommand } from '../domain/use-cases/login-user.command.js';
import { TokenPair } from '../../common/types/token.types.js';
import { LogoutUserCommand } from '../domain/use-cases/logout-user.command.js';
import { RefreshTokenCommand } from '../domain/use-cases/refresh-token.command.js';
import { AccessTokenGuard } from '../../common/guards/access-token.guard.js';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard.js';
import type { RefreshTokenRequest } from '../../common/types/refresh-token-request.interface.js';

@Controller('auth')
export class AuthController {
  constructor(
    protected commandBus: CommandBus,
    protected ipUtil: IpUtil,
  ) {}

  @HttpCode(HttpStatus.CREATED)
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
    const deviceName = request.get('user-agent') ?? 'Undefined device';

    const tokensPair: TokenPair = await this.commandBus.execute(
      new LoginUserCommand(loginInputDto, ip, deviceName),
    );

    response.cookie('refreshToken', tokensPair.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken: tokensPair.accessToken };
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async handleLogout(@Req() request: RefreshTokenRequest) {
    const sessionId = request.sessionId;
    return await this.commandBus.execute(new LogoutUserCommand(sessionId));
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async handleRefreshToken(
    @Req() request: RefreshTokenRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionId = request.sessionId;
    const refreshTokenCreationDate = request.refreshTokenCreationDate;

    const tokensPair: TokenPair = await this.commandBus.execute(
      new RefreshTokenCommand(sessionId, refreshTokenCreationDate),
    );

    response.cookie('refreshToken', tokensPair.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken: tokensPair.accessToken };
  }
}
