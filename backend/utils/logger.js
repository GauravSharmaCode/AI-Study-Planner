import winston from "winston";
import path from "path";

// Replace the existing getCallerInfo function
const getCallerInfo = () => {
  const stack = new Error().stack.split('\n').slice(1);

  for (const line of stack) {
    // Skip irrelevant stack frames
    if (!line || 
        line.includes('node_modules') || 
        line.includes('internal/') ||
        line.includes('logger.js') ||
        line.includes('at async') ||
        line.includes('at Module.')) {
      continue;
    }

    // Match both ESM and CommonJS stack frames
    const patterns = [
      /at\s+([^(]+)\s+\((?:file:\/\/\/)?([^:]+)/,  // Named function in parentheses
      /at\s+(?:file:\/\/\/)?([^:]+)/,               // File path only
      /at\s+([^(\s]+)\s*\(?([^)]+)/                 // More general pattern
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let functionName, filePath;
        
        if (pattern === patterns[0] || pattern === patterns[2]) {
          functionName = match[1].trim();
          filePath = match[2];
        } else {
          functionName = 'anonymous';
          filePath = match[1];
        }

        // Clean up function name and file path
        functionName = functionName.split(' ')[0]; // Remove any extra parts
        const fileName = path.basename(filePath);

        if (!filePath.includes('node_modules')) {
          return { fileName, functionName };
        }
      }
    }
  }
  
  return { fileName: "unknown", functionName: "unknown" };
};

// Custom format for logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const { fileName, functionName } = getCallerInfo();
    if (stack) {
      return `${timestamp} ${level} [${fileName} -> ${functionName}]: ${message}\n${stack}`;
    }
    return `${timestamp} ${level} [${fileName} -> ${functionName}]: ${message}`;
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
/**
 * Logs a message with the origin file and function name.
 * @param {String} message - The message to log.
 * @param {String} level - The log level (e.g., "info", "warn", "error").
 * @param {String} origin - The origin of the log (e.g., "index.js", "config/db.js").
 * @returns {undefined}
 */
logger.logWithOrigin = (message, level = "info", origin = "unknown") => {
  logger.log({
    level,
    message: `${message} (Origin: ${origin})`,
  });
};