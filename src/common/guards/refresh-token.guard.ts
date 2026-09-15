import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from '../jwt-token.service.js';
import { RefreshTokenPayload, TokenTypes } from '../types/token.types.js';
import { ErrorObjectFactory } from '../utils/error-object.factory.js';
import { RefreshTokenRequest } from '../types/refresh-token-request.interface.js';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(protected jwtTokenService: JwtTokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RefreshTokenRequest>();
    const refreshToken = request.cookies.refreshToken;
    const verifiedRefreshToken: RefreshTokenPayload | null =
      await this.jwtTokenService.verifyToken(refreshToken, TokenTypes.REFRESH);

    if (!verifiedRefreshToken) {
      throw new UnauthorizedException(
        ErrorObjectFactory.createError('Invalid Refresh Token', 'cookies'),
      );
    } else {
      const { userId, sessionId, createdAt } = verifiedRefreshToken;
      request.userId = userId;
      request.sessionId = sessionId;
      request.refreshTokenCreationDate = createdAt;
      return true;
    }
  }
}
