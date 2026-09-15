import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from '../jwt-token.service.js';
import { ErrorObjectFactory } from '../utils/error-object.factory.js';
import { AccessTokenPayload, TokenTypes } from '../types/token.types.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(protected jwtTokenService: JwtTokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        ErrorObjectFactory.createError(
          'Access Token not found in Authorization header',
          'Auth header',
        ),
      );
    }

    const accessToken = authHeader.split(' ')[1];

    const verifiedAccessToken: AccessTokenPayload | null =
      await this.jwtTokenService.verifyToken(accessToken, TokenTypes.ACCESS);

    if (!verifiedAccessToken) {
      throw new UnauthorizedException(
        ErrorObjectFactory.createError('Invalid Access Token', 'Auth header'),
      );
    } else {
      const { userId, sessionId } = verifiedAccessToken;
      request.userId = userId;
      request.sessionId = sessionId;
      return true;
    }
  }
}
