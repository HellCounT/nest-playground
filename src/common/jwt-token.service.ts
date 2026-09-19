import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AppConfigService } from '../config/app-config.service.js';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { TokenTypes, TokenPayloadMap } from './types/token.types.js';
import { v4 as uuidv4 } from 'uuid';
import {
  InvalidTokenException,
  JwtTokenCreationFailedException,
  JwtTokenVerificationException,
} from './exceptions/domain-exceptions.js';

@Injectable()
export class JwtTokenService {
  constructor(protected configService: AppConfigService) {}
  public async createToken<T extends object>(
    payload: T,
    tokenType: TokenTypes,
  ): Promise<string> {
    try {
      const secret =
        tokenType === TokenTypes.ACCESS
          ? this.configService.secretAccessToken
          : this.configService.secretRefreshToken;
      const expiresIn =
        tokenType === TokenTypes.REFRESH
          ? this.configService.lifetimeRefreshToken
          : this.configService.lifetimeAccessToken;
      return jwt.sign(payload, secret, {
        expiresIn,
        jwtid: uuidv4(),
      } as SignOptions);
    } catch (e) {
      throw new JwtTokenCreationFailedException(e);
    }
  }
  public async verifyToken<T extends TokenTypes>(
    token: string,
    tokenType: T,
  ): Promise<TokenPayloadMap[T]> {
    const secret =
      tokenType === TokenTypes.ACCESS
        ? this.configService.secretAccessToken
        : this.configService.secretRefreshToken;

    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      throw new JwtTokenVerificationException(e);
    }

    if (
      typeof payload === 'string' ||
      !this.isValidPayload(payload, tokenType)
    ) {
      throw new InvalidTokenException();
    }

    return payload;
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
