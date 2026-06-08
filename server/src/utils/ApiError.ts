import { ErrorCode } from "@devboard/shared";

/**
 * Operational error with an HTTP status, a stable machine code, and optional
 * field-level details. Thrown anywhere; caught by the error-handling middleware.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: Record<string, string[]>) {
    return new ApiError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, ErrorCode.UNAUTHORIZED, message);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(403, ErrorCode.FORBIDDEN, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, ErrorCode.NOT_FOUND, message);
  }
  static conflict(message: string) {
    return new ApiError(409, ErrorCode.CONFLICT, message);
  }
}
