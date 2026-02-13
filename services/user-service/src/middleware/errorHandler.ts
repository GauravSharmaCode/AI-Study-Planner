import { Request, Response, NextFunction } from "express";
import { logWithMeta } from "@gauravsharmacode/neat-logger";

// Extend Error interface for database errors
interface DatabaseError extends Error {
  path?: string;
  value?: any;
  code?: number;
  errmsg?: string;
  errors?: Record<string, { message: string }>;
  isOperational?: boolean;
  statusCode?: number;
  status?: string;
}

/**
 * Global error handling middleware for Express applications.
 *
 * Handles and formats various error types, including database errors,
 * validation errors, and JWT errors, returning a standardized JSON response.
 * Logs error details with metadata for debugging and auditing purposes.
 *
 * @param err - The error object, possibly extended with database-specific properties.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;


  /**
   * Creates an instance of the AppError class.
   *
   * @param message - Error message string.
   * @param statusCode - HTTP status code for the error.
   * @param isOperational - Optional boolean indicating if the error is operational
   * (i.e. not a programming error, but a client or network error).
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

const handleCastErrorDB = (err: DatabaseError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: DatabaseError): AppError => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: DatabaseError): AppError => {
  if (!err.errors) return new AppError("Validation error", 400);

  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

const globalErrorHandler = (
  err: DatabaseError,
  req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void => {
  // Log the error for debugging
  logWithMeta("ERROR 💥", {
    level: "error",
    extra: {
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    },
  });

  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Handle specific error types
  let error: DatabaseError = { ...err, message: err.message };

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

  // Always return clean JSON response
  res.status(error.statusCode || 500).json({
    status: error.status || "error",
    message: error.message || "Something went wrong!",
  });
};

export default globalErrorHandler;
