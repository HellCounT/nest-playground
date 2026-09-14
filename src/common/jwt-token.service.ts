import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from '../config/app-config.service.js';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { TokenTypes, TokenPayloadMap } from '../auth/types/token.types.js';

@Injectable()
export class JwtTokenService {
  constructor(protected configService: AppConfigService) {}
  public async createToken<T extends object>(
    payload: T,
    tokenType: TokenTypes,
  ): Promise<string | null> {
    try {
      const secret =
        tokenType === TokenTypes.ACCESS
          ? this.configService.secretAccessToken
          : this.configService.secretRefreshToken;
      const expiresIn =
        tokenType === TokenTypes.REFRESH
          ? this.configService.lifetimeRefreshToken
          : this.configService.lifetimeAccessToken;
      return jwt.sign(payload, secret, { expiresIn } as SignOptions);
    } catch (e) {
      console.error('Error occurred on token creation', e);
      return null;
    }
  }
  public async verifyToken<T extends TokenTypes>(
    token: string,
    tokenType: T,
  ): Promise<TokenPayloadMap[T] | null> {
    try {
      const secret =
        tokenType === TokenTypes.ACCESS
          ? this.configService.secretAccessToken
          : this.configService.secretRefreshToken;

      const payload = jwt.verify(token, secret);

      if (typeof payload === 'string') {
        return null;
      }

      if (!this.isValidPayload(payload, tokenType)) {
        return null;
      }

      return payload;
    } catch (e) {
      console.error('Error occurred on token verification', e);
      return null;
    }
  }
  private isValidPayload<T extends TokenTypes>(
    payload: JwtPayload,
    tokenType: T,
  ): payload is JwtPayload & TokenPayloadMap[T] {
    if (tokenType === TokenTypes.ACCESS) {
      return (
        typeof payload.userId === 'string' &&
        typeof payload.sessionId === 'string'
      );
    }

    return (
      typeof payload.userId === 'string' &&
      typeof payload.sessionId === 'string' &&
      typeof payload.createdAt === 'string'
    );
  }
}
