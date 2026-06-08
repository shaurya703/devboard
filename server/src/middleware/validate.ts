import { RequestHandler } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

type Source = "body" | "query" | "params";

/**
 * Validate a request segment against a zod schema. On success the parsed
 * (and coerced) value replaces the original segment. On failure throws a
 * 400 ApiError with field-level details.
 */
export const validate =
  (schema: ZodSchema, source: Source = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return next(
        ApiError.badRequest("Validation failed", details)
      );
    }
    // Replace with parsed data (e.g. trimmed/lowercased/coerced values).
    req[source] = result.data;
    next();
  };
