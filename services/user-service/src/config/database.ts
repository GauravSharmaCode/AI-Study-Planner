import { PrismaClient, Prisma } from "@prisma/client";
import { logWithMeta } from "@gauravsharmacode/neat-logger";
import config from "../config";

// Create Prisma client
const separator = process.env.DATABASE_URL?.includes("?") ? "&" : "?";
const basePrisma = new PrismaClient({
  log: config.isDevelopment
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
      url: process.env.DATABASE_URL + `${separator}connection_limit=10&pool_timeout=20&connect_timeout=10`,
    },
  },
});

// Event listeners must be registered on the base client before $extends().
// (See Prisma docs: listeners added after $extends() are not wired for the extended client.)
basePrisma.$on("query", (e: Prisma.QueryEvent) => {
  if (config.database.logQueries) {
    logWithMeta("Raw SQL Query", {
      func: "prismaQuery",
      level: "info",
      extra: {
        query: e.query,
        params: e.params,
        durationMs: e.duration,
        target: e.target,
      },
    });
  }
});

basePrisma.$on("error", (e: Prisma.LogEvent) => {
  logWithMeta("Database error", {
    func: "prismaError",
    level: "error",
    extra: {
      target: e.target,
      message: e.message ?? "Unknown error",
      timestamp: e.timestamp,
    },
  });
});

basePrisma.$on("warn", (e: Prisma.LogEvent) => {
  logWithMeta("Database warning", {
    func: "prismaWarn",
    level: "warn",
    extra: {
      target: e.target,
      message: e.message ?? "Unknown warning",
      timestamp: e.timestamp,
    },
  });
});

basePrisma.$on("info", (e: Prisma.LogEvent) => {
  logWithMeta("Database info", {
    func: "prismaInfo",
    level: "info",
    extra: {
      target: e.target,
      message: e.message ?? "Information",
      timestamp: e.timestamp,
    },
  });
});

/**
 * Prisma extension to log database queries.
 * Replaces the deprecated middleware system in Prisma 6.
 */
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const after = Date.now();
        const duration = after - before;

        if (config.database.logQueries) {
          const logData = {
            model,
            action: operation,
            duration: `${duration}ms`,
            query: args,
          };

          if (
            config.database.logSlowQueries &&
            duration > config.database.slowQueryThreshold
          ) {
            logWithMeta("Slow query detected", {
              func: "queryLogger",
              level: "warn",
              extra: {
                ...logData,
                threshold: `${config.database.slowQueryThreshold}ms`,
              },
            });
          } else {
            logWithMeta("Database query executed", {
              func: "queryLogger",
              level: "info",
              extra: logData,
            });
          }
        }

        return result;
      },
    },
  },
});

// Connection test
const testConnection = async (): Promise<void> => {
  try {
    // Note: use basePrisma for connection lifecycle management
    await basePrisma.$connect();
    logWithMeta("Database connection established successfully", {
      func: "testConnection",
      level: "info",
      extra: {
        service: config.serviceName,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logWithMeta("Failed to connect to database", {
      func: "testConnection",
      level: "error",
      extra: {
        error: errorMessage,
        service: config.serviceName,
      },
    });
    throw error;
  }
};

// Graceful disconnect
const disconnect = async (): Promise<void> => {
  try {
    await basePrisma.$disconnect();
    logWithMeta("Database connection closed gracefully", {
      func: "disconnect",
      level: "info",
      extra: {
        service: config.serviceName,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logWithMeta("Error closing database connection", {
      func: "disconnect",
      level: "error",
      extra: {
        error: errorMessage,
        service: config.serviceName,
      },
    });
  }
};

export { prisma, testConnection, disconnect };
