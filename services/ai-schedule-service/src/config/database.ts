import { PrismaClient } from "@prisma/client";
import { createLogger } from "../utils/logger";

const logger = createLogger("database");

/**
 * Prisma middleware to log database queries.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queryLogger = () => {
  return async (params: any, next: (params: any) => Promise<any>) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    const logData = {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
    };

    if (duration > 1000) {
      logger.warn("Slow query detected", logData);
    } else if (process.env.NODE_ENV === "development") {
      logger.info("Database query executed", logData);
    }

    return result;
  };
};

// Create Prisma client with connection pool configuration
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "info" },
          { emit: "event", level: "warn" },
        ]
      : [
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL +
        "?connection_limit=10&pool_timeout=20&connect_timeout=10",
    },
  },
});

// Add query middleware
// prisma.$use(queryLogger()); // Removed: Prisma v6 doesn't support $use as coded

// Event listeners for Prisma logs
if (process.env.NODE_ENV !== "test") {
  prisma.$on("error", (e: any) => {
    logger.error("Database error", {
      target: e.target,
      message: e.message,
      timestamp: e.timestamp,
    });
  });

  prisma.$on("warn", (e: any) => {
    logger.warn("Database warning", {
      target: e.target,
      message: e.message,
      timestamp: e.timestamp,
    });
  });
}

// Connection test
const testConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("Database connection established successfully", {
      service: "ai-schedule-service",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to connect to database", {
      error: errorMessage,
      service: "ai-schedule-service",
    });
    throw error;
  }
};

// Graceful disconnect
const disconnect = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed gracefully", {
      service: "ai-schedule-service",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error closing database connection", {
      error: errorMessage,
      service: "ai-schedule-service",
    });
  }
};

export { prisma, testConnection, disconnect };
