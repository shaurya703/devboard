import { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { ApiFailure, ErrorCode } from "@devboard/shared";
import { isProd } from "../config/env";

/** 404 for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
};

/**
 * Central error handler. Normalizes ApiError, ZodError, and known Prisma
 * errors into the consistent failure envelope. Unknown errors → 500.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let body: ApiFailure;
  let status: number;

  if (err instanceof ApiError) {
    status = err.statusCode;
    body = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        details: err.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 unique constraint, P2025 record not found.
    if (err.code === "P2002") {
      status = 409;
      body = {
        success: false,
        error: { code: ErrorCode.CONFLICT, message: "Resource already exists" },
      };
    } else if (err.code === "P2025") {
      status = 404;
      body = {
        success: false,
        error: { code: ErrorCode.NOT_FOUND, message: "Resource not found" },
      };
    } else {
      status = 400;
      body = {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Database request error",
        },
      };
    }
  } else {
    status = 500;
    body = {
      success: false,
      error: {
        code: ErrorCode.INTERNAL,
        message: isProd ? "Internal server error" : String(err?.message ?? err),
      },
    };
    // Always log unexpected errors server-side.
    console.error("Unhandled error:", err);
  }

  res.status(status).json(body);
};
