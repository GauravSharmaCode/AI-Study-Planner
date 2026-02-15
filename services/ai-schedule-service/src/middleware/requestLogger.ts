import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { sanitize } from '../utils/sanitizer';

const logger = createLogger('request-logger');

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log Request Entry
  logger.entry('requestLogger', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    body: sanitize(req.body),
    query: sanitize(req.query),
  });

  // Hook Response (JSON only for now)
  const originalJson = res.json;

  res.json = function (body) {
    const duration = Date.now() - start;
    logger.info(`Outgoing Response: ${res.statusCode} (${duration}ms)`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      body: sanitize(body)
    });
    return originalJson.call(this, body);
  };

  next();
};
