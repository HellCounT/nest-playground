export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export enum TokenTypes {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

export type AccessTokenPayload = {
  userId: string;
  sessionId: string;
};

export type RefreshTokenPayload = {
  userId: string;
  sessionId: string;
  createdAt: string;
};

export type TokenPayloadMap = {
  [TokenTypes.ACCESS]: AccessTokenPayload;
  [TokenTypes.REFRESH]: RefreshTokenPayload;
};
