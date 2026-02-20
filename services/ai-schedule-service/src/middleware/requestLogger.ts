import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { sanitize } from '../utils/sanitizer';
import { contextStore } from '../utils/context';

const logger = createLogger('request-logger');

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Extract and store planId if present
  const planId = req.body?.planId || req.params?.planId;
  if (planId) {
    const store = contextStore.getStore();
    if (store) {
      store.planId = planId;
    }
  }

  // Log Request Entry
  logger.entry('requestLogger', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    requestId: req.requestId, // Explicitly log requestId for easier grepping
    planId,
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
