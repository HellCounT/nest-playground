import { HttpStatus } from '@nestjs/common';

export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const domainExceptionStatusMap: Record<string, HttpStatus> = {
  USER_NOT_FOUND: HttpStatus.UNAUTHORIZED,
  INVALID_PASSWORD: HttpStatus.UNAUTHORIZED,
  USER_ALREADY_EXISTS: HttpStatus.BAD_REQUEST,
  USER_CREATION_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,
  SESSION_NOT_FOUND: HttpStatus.UNAUTHORIZED,
  SESSION_CREATION_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,
  SESSION_UPDATE_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,
  PASSWORD_HASH_GENERATION_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,
  JWT_TOKEN_CREATION_FAILED: HttpStatus.UNAUTHORIZED,
  JWT_TOKEN_VERIFICATION_FAILED: HttpStatus.UNAUTHORIZED,
  INVALID_TOKEN: HttpStatus.UNAUTHORIZED,
};

export class UserNotFoundException extends DomainException {
  constructor() {
    super('User not found', 'USER_NOT_FOUND', 'userId');
  }
}

export class UserCreationFailedException extends DomainException {
  constructor() {
    super('User creation failed', 'USER_CREATION_FAILED');
  }
}

export class InvalidPasswordException extends DomainException {
  constructor() {
    super('Invalid password', 'INVALID_PASSWORD', 'password');
  }
}

export class UserAlreadyExistsException extends DomainException {
  constructor(field: 'login' | 'email') {
    super(
      `User with this ${field} already exists`,
      'USER_ALREADY_EXISTS',
      field,
    );
  }
}

export class SessionNotFoundException extends DomainException {
  constructor() {
    super('Session does not exist', 'SESSION_NOT_FOUND');
  }
}

export class SessionCreationFailedException extends DomainException {
  constructor() {
    super('Session creation failed', 'SESSION_CREATION_FAILED');
  }
}

export class SessionUpdateFailedException extends DomainException {
  constructor() {
    super('Session update failed', 'SESSION_UPDATE_FAILED');
  }
}

export class PasswordHashGenerationFailedException extends DomainException {
  constructor(cause: unknown) {
    super(
      'Error occurred on password hash generation',
      'PASSWORD_HASH_GENERATION_FAILED',
      'hash generation',
      cause,
    );
  }
}

export class JwtTokenCreationFailedException extends DomainException {
  constructor(cause: unknown) {
    super(
      'Error occurred on token creation',
      'JWT_TOKEN_CREATION_FAILED',
      'token',
      cause,
    );
  }
}

export class JwtTokenVerificationException extends DomainException {
  constructor(cause: unknown) {
    super(
      'Error occurred on token verification',
      'JWT_TOKEN_VERIFICATION_FAILED',
      'token',
      cause,
    );
  }
}

export class InvalidTokenException extends DomainException {
  constructor() {
    super('Invalid JWT token', 'INVALID_TOKEN');
  }
}
