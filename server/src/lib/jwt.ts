import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as AccessTokenPayload;
};

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // unique token id, stored hashed for rotation/reuse-detection
}

export const signRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  } as SignOptions);

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as RefreshTokenPayload;
};

/** Random opaque id used as the refresh-token jti. */
export const newJti = (): string => crypto.randomUUID();

/** Hash a token before storing it, so a DB leak can't reissue sessions. */
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
