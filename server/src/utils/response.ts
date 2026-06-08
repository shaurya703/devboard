import { Response } from "express";
import { ApiSuccess } from "@devboard/shared";

/** Send a consistent success envelope. */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200
): Response<ApiSuccess<T>> {
  return res.status(statusCode).json({ success: true, data });
}

/** Wrap an async route handler so thrown/rejected errors hit the error middleware. */
import { RequestHandler } from "express";
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
