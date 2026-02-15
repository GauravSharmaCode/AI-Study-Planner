import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { contextStore } from '../utils/context';

const CORRELATION_HEADER = 'X-Correlation-ID';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
      // userId is added by auth middleware usually, but correlationId is added here
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers[CORRELATION_HEADER.toLowerCase()] as string) || uuidv4();

  // Attach to request
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  // Update context store if available
  const store = contextStore.getStore();
  if (store) {
    store.correlationId = correlationId;
  }

  next();
}
