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

/**
 * Logs a query execution start.
 * @param {Object} query - The query object
 * @param {Array} [params=[]] - Query parameters
 * @returns {undefined}
 */
logger.queryStart = (query, params = []) => {
  logger.debug(
    `Executing query: ${query.strings.join(" ")} with params: [${params.join(
      ", "
    )}]`
  );
};

/**
 * Logs a successful query execution.
 * @param {String} message - A message describing the query
 * @returns {undefined}
 */
logger.querySuccess = (message) => {
  logger.info(`Query executed successfully: ${message}`);
};

/**
 * Logs an error that occurred during query execution.
 * @param {Error} error - The error object associated with the query failure.
 * @param {String} context - A description of the context in which the query failed.
 * @returns {undefined}
 */

logger.queryError = (error, context) => {
  logger.error(`Query failed in ${context}: ${error.stack || error.message}`);
};

/**
 * Logs an error that occurred during an API call.
 * @param {Error} error - The error object associated with the API call failure.
 * @param {String} context - A description of the context in which the API call failed.
 * @returns {undefined}
 */
logger.apiError = (error, context) => {
  logger.error(`API Error in ${context}: ${error.stack || error.message}`);
};

// Do not redefine logger.error to avoid recursion
export default logger;
