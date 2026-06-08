import { Response } from "express";
import { env, isProd } from "../config/env";

export const REFRESH_COOKIE = "devboard_refresh";

/** Parse a TTL like "7d" / "15m" / "3600s" into milliseconds. */
export function ttlToMs(ttl: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
  if (!match) return Number(ttl) || 0;
  const value = Number(match[1]);
  const unit = match[2];
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return value * mult;
}

/** Set the refresh token as an httpOnly cookie scoped to the auth routes. */
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: ttlToMs(env.REFRESH_TOKEN_TTL),
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}
