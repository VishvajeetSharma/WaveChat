export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // expected, safe-to-expose error (vs a bug)
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message, details) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static notFound(message = "Not found") {
    return new AppError(message, 404);
  }
}

export default AppError;
