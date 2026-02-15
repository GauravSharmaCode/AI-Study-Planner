import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger-wrapper';
import { sanitize } from '../utils/sanitizer';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log Request Entry
  logger.info(`Incoming Request: ${req.method} ${req.url}`, 'requestLogger', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    body: sanitize(req.body),
    query: sanitize(req.query),
  });

  // Hook Response (JSON only for now to avoid stream issues)
  const originalJson = res.json;

  res.json = function (body) {
    const duration = Date.now() - start;
    logger.info(`Outgoing Response: ${res.statusCode} (${duration}ms)`, 'requestLogger', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      body: sanitize(body)
    });
    return originalJson.call(this, body);
  };

  next();
};
