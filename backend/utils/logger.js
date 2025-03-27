import winston from "winston";
import path from "path";

// Custom format for logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} ${level}: ${message}\n${stack}`;
    }
    return `${timestamp} ${level}: ${message}`;
  })
);

// Define log directory and files
const LOG_DIR = "logs";
const ERROR_LOG = path.join(LOG_DIR, "error.log");
const COMBINED_LOG = path.join(LOG_DIR, "combined.log");
const QUERY_LOG = path.join(LOG_DIR, "query.log");

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),
    new winston.transports.File({ filename: ERROR_LOG, level: "error" }),
    new winston.transports.File({ filename: COMBINED_LOG }),
    new winston.transports.File({ filename: QUERY_LOG, level: "debug" }),
  ],
});

// Extend logger with helper methods
logger.queryStart = (query, params = []) => {
  logger.debug(
    `Executing query: ${query.strings.join(" ")} with params: [${params.join(
      ", "
    )}]`
  );
};

logger.querySuccess = (message) => {
  logger.info(`Query executed successfully: ${message}`);
};

logger.queryError = (error, context) => {
  logger.error(`Query failed in ${context}: ${error.stack}`);
};

logger.apiError = (error, context) => {
  logger.error(`API Error in ${context}: ${error.stack}`);
};

// Keep original helper methods for backward compatibility
logger.debug = logger.debug.bind(logger);
logger.info = logger.info.bind(logger);
logger.error = (error, context) => {
  logger.error(`Error in ${context}: ${error.stack}`);
};

export default logger;
