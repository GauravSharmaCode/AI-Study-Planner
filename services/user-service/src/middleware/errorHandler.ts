import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger-wrapper";

// Extend Error interface for database errors
interface DatabaseError extends Error {
  path?: string;
  value?: unknown;
  code?: number;
  errmsg?: string;
  errors?: Record<string, { message: string }>;
  isOperational?: boolean;
  statusCode?: number;
  status?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

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
  logger.error("ERROR 💥", "globalErrorHandler", {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    statusCode: err.statusCode || 500
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
