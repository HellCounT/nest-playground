import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from '../jwt-token.service.js';
import { AccessTokenPayload, TokenTypes } from '../types/token.types.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(protected jwtTokenService: JwtTokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [schema, accessToken] = authHeader.split(' ');
    if (schema !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Invalid Access Token');
    }

    const verifiedAccessToken: AccessTokenPayload | null =
      await this.jwtTokenService.verifyToken(accessToken, TokenTypes.ACCESS);

    if (!verifiedAccessToken) {
      throw new UnauthorizedException('Invalid Access Token');
    } else {
      const { userId, sessionId } = verifiedAccessToken;
      request.userId = userId;
      request.sessionId = sessionId;
      return true;
    }
  }
}
