import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from '../jwt-token.service.js';
import { RefreshTokenPayload, TokenTypes } from '../types/token.types.js';
import { RefreshTokenRequest } from '../types/refresh-token-request.interface.js';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(protected jwtTokenService: JwtTokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RefreshTokenRequest>();
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const verifiedRefreshToken: RefreshTokenPayload | null =
      await this.jwtTokenService.verifyToken(refreshToken, TokenTypes.REFRESH);

    if (!verifiedRefreshToken) {
      throw new UnauthorizedException();
    } else {
      const { userId, sessionId, createdAt } = verifiedRefreshToken;
      request.userId = userId;
      request.sessionId = sessionId;
      request.refreshTokenCreationDate = createdAt;
      return true;
    }
  }
}
