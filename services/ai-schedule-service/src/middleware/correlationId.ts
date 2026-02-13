/**
 * Correlation ID Middleware
 *
 * Reads X-Correlation-ID from request headers (or generates a UUID).
 * Attaches it to `req` and sets it on the response header.
 */
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const CORRELATION_HEADER = 'X-Correlation-ID';

// Extend Express Request to include correlationId and userId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      userId: string;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers[CORRELATION_HEADER.toLowerCase()] as string) || randomUUID();

  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  next();
}
