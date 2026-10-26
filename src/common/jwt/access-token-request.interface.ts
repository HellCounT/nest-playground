import type { Request } from 'express';

export interface AccessTokenRequest extends Request {
  userId: string;
  sessionId: string;
}
