import { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { ApiError } from "../utils/ApiError";

/**
 * Authenticate via the Bearer access token (Authorization header).
 * Access tokens are short-lived and sent by the client from memory; the
 * refresh token lives in an httpOnly cookie and is only used at /refresh.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing access token"));
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
};
