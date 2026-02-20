import winston from "winston";
import { getContext } from "./context";
import { sanitize } from "./sanitizer";

const contextFormat = winston.format((info) => {
  const context = getContext();
  if (context.correlationId) info.correlationId = context.correlationId;
  if (context.requestId) info.requestId = context.requestId;
  if (context.userId) info.userId = context.userId;
  if (context.planId) info.planId = context.planId;
  return info;
});

export const createLogger = (serviceName: string) => {
  const transports =
    process.env.NODE_ENV === "test"
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        ]
      : [
          new winston.transports.File({
            filename: `logs/${serviceName}-error.log`,
            level: "error",
          }),
          new winston.transports.File({
            filename: `logs/${serviceName}-combined.log`,
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        ];

  const winstonLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      contextFormat(), // Add context
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(
        ({ timestamp, level, message, service, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            service: service || serviceName,
            message,
            ...meta,
          });
        },
      ),
    ),
    defaultMeta: { service: serviceName },
    transports,
  });

  return {
    info: (message: string, meta: any = {}) => winstonLogger.info(message, meta),
    warn: (message: string, meta: any = {}) => winstonLogger.warn(message, meta),
    error: (message: string, meta: any = {}) => winstonLogger.error(message, meta),
    debug: (message: string, meta: any = {}) => winstonLogger.debug(message, meta),

    // Custom methods
    entry: (func: string, args: any = {}) => {
      winstonLogger.info("Function Entry", { func, payload: sanitize(args) });
    },
    exit: (func: string, result: any = {}) => {
      winstonLogger.info("Function Exit", { func, result: sanitize(result) });
    },
    stateChange: (func: string, stateName: string, before: any, after: any) => {
      winstonLogger.info(`State Change: ${stateName}`, {
        func,
        before: sanitize(before),
        after: sanitize(after),
      });
    }
  };
};

export default createLogger;
