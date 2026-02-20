import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { contextStore } from '../utils/context';

const REQUEST_ID_HEADER = 'X-Request-ID';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string) || randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  const store = contextStore.getStore();
  if (store) {
    store.requestId = requestId;
  }

  next();
}
