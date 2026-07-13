import logger from "../utils/logger.js";
import config from "../config/env.js";
import AppError from "../errors/AppError.js";

// Must be registered last, after all routes.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unexpected/programmer error — log full detail server-side, never leak internals.
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found" });
}

export default errorHandler;
