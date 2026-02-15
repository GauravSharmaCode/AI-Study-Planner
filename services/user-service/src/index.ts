import express, { Request, Response, Application } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Server } from "http";

import { logger } from "./utils/logger-wrapper";
import config from "./config";
import { testConnection, disconnect } from "./config/database";
import globalErrorHandler from "./middleware/errorHandler";
import { contextMiddleware } from "./middleware/contextMiddleware";
import { correlationIdMiddleware } from "./middleware/correlationId";
import { requestLogger } from "./middleware/requestLogger";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

import { HealthResponse, ApiError } from "./interfaces";

const app: Application = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Context & Correlation ID (First!)
app.use(contextMiddleware);
app.use(correlationIdMiddleware);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use("/api/", limiter as any);

// CORS middleware
app.use(cors(config.cors));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware (After body parser)
app.use(requestLogger);

// Health check endpoints
app.get("/", (req: Request, res: Response) => {
  logger.info("Root endpoint hit", "/", { level: "info" });
  res.status(200).json({
    status: "success",
    message: `${config.serviceName} is running!`,
    version: "1.0.0",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req: Request, res: Response) => {
  logger.info("Health check endpoint hit", "/health", { level: "info" });
  const healthResponse: HealthResponse = {
    status: "success",
    message: "Service is healthy",
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
  res.status(200).json(healthResponse);
});

// API routes - Updated to match NGINX gateway expectations
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Legacy API routes (for backward compatibility)
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Catch-all route for undefined routes
app.all("*", (req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, "routeNotFound", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  const errorResponse: ApiError = {
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
    statusCode: 404,
  };

  res.status(404).json(errorResponse);
});

// Global error handling middleware
app.use(globalErrorHandler);

/**
 * Handles graceful shutdown of the application.
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`, "gracefulShutdown", { signal });

  try {
    await disconnect();
    logger.info("Database connection closed", "gracefulShutdown");
    process.exit(0);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error during graceful shutdown", "gracefulShutdown", { error: errorMessage });
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/**
 * Starts the Express server and listens for incoming requests.
 */
const startServer = async (): Promise<Server> => {
  try {
    // Test database connection
    await testConnection();

    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} listening on port ${config.port}`, "startServer", {
        port: config.port,
        environment: config.nodeEnv,
        service: config.serviceName,
      });
    });

    // Handle server errors
    server.on("error", (error: Error) => {
      logger.error("Server error", "serverError", { error: error.message });
      process.exit(1);
    });

    return server;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to start server", "startServer", { error: errorMessage });
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
