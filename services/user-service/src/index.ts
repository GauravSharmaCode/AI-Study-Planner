import express, { Request, Response, NextFunction, Application } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Server } from "http";

import { logWithMeta } from "@gauravsharmacode/neat-logger";
import config from "./config";
import { testConnection, disconnect } from "./config/database";
import globalErrorHandler from "./middleware/errorHandler";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

import { HealthResponse, ApiError } from "./interfaces";

const app: Application = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

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

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // const startTime = Date.now();

  /**
   * Logs HTTP requests with a structured JSON format.
   *
   * @func logRequest
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   *
   * @prop {string} level - "error", "warn", or "info" based on the response status code
   * @prop {string} func - Always "requestLogger"
   * @prop {Object} extra - Additional logging information
   * @prop {string} extra.method - HTTP method
   * @prop {string} extra.url - Request URL
   * @prop {string} extra.statusCode - HTTP status code
   * @prop {string} extra.ip - Request IP address
   * @prop {number} extra.userId - User ID if authenticated (optional)
   */
  const logRequest = () => {
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logWithMeta(
      `>>>>> HTTP ${req.method} Request recieved at ${req.originalUrl} URL with payload ${JSON.stringify(req.body)}>>>>>`,
      {
        func: "requestLogger",
        level,
        extra: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          ip: req.ip,
          // @ts-expect-error - user added by auth middleware
          userId: req.user?.id,
        },
      }
    );
  };

  res.on("finish", logRequest);
  res.on("close", logRequest);

  next();
});

// Health check endpoints
app.get("/", (req: Request, res: Response) => {
  logWithMeta("Root endpoint hit", { func: "/", level: "info" });
  res.status(200).json({
    status: "success",
    message: `${config.serviceName} is running!`,
    version: "1.0.0",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req: Request, res: Response) => {
  logWithMeta("Health check endpoint hit", { func: "/health", level: "info" });
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
  logWithMeta(`Route not found: ${req.method} ${req.originalUrl}`, {
    func: "routeNotFound",
    level: "warn",
    extra: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
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
 *
 * This function listens for termination signals and attempts to cleanly
 * shut down the application. It logs the received signal and performs
 * necessary cleanup operations, such as closing the database connection.
 * If an error occurs during the shutdown process, it logs the error
 * and exits the process with a failure status.
 *
 * @param {string} signal - The termination signal received (e.g., SIGTERM, SIGINT).
 * @returns {Promise<void>} - A promise that resolves when the shutdown process is complete.
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logWithMeta(`${signal} received, shutting down gracefully`, {
    func: "gracefulShutdown",
    level: "info",
    extra: { signal },
  });

  try {
    await disconnect();
    logWithMeta("Database connection closed", {
      func: "gracefulShutdown",
      level: "info",
    });
    process.exit(0);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logWithMeta("Error during graceful shutdown", {
      func: "gracefulShutdown",
      level: "error",
      extra: { error: errorMessage },
    });
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/**
 * Starts the Express server and listens for incoming requests.
 *
 * This function initializes the server, tests the database connection,
 * and starts listening on the configured port. It also handles server
 * errors and logs relevant information.
 *
 * @returns {Promise<Server>} - A promise that resolves to the HTTP server instance.
 */
const startServer = async (): Promise<Server> => {
  try {
    // Test database connection
    await testConnection();

    const server = app.listen(config.port, () => {
      logWithMeta(`${config.serviceName} listening on port ${config.port}`, {
        func: "startServer",
        level: "info",
        extra: {
          port: config.port,
          environment: config.nodeEnv,
          service: config.serviceName,
        },
      });
    });

    // Handle server errors
    server.on("error", (error: Error) => {
      logWithMeta("Server error", {
        func: "serverError",
        level: "error",
        extra: { error: error.message },
      });
      process.exit(1);
    });

    return server;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logWithMeta("Failed to start server", {
      func: "startServer",
      level: "error",
      extra: { error: errorMessage },
    });
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
