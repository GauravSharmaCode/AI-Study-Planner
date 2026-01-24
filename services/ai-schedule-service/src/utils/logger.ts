import winston from "winston";

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

  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
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
};

export default createLogger;
