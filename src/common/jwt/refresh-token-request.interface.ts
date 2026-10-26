import type { Request } from 'express';

export interface RefreshTokenRequest extends Request {
  userId: string;
  sessionId: string;
  refreshTokenCreationDate: string;
}
