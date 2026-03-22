import { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger";

const logger = createLogger('errorHandler');

/**
 * Custom error class for application-specific operational errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  /**
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param isOperational - Whether the error is a known operational error
   */
  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware for Express.
 */
const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Map specific domain errors to HTTP errors
  if (err.name === "OverloadError") {
    err.statusCode = 422; // Unprocessable Entity
    err.status = "fail";
    err.code = "SCHEDULE_OVERLOADED";
  }

  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error
  logger.error(err.message || "Unknown error", {
    url: req.originalUrl,
    method: req.method,
    statusCode: err.statusCode,
    stack: err.stack,
    ip: req.ip
  });

  // Return clean JSON response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || "Internal Server Error",
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
};

export default globalErrorHandler;
