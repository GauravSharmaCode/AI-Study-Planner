import { Request, Response, NextFunction } from 'express';
import { contextStore } from '../utils/context';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const store = {}; // Mutable context object
  contextStore.run(store, () => {
    next();
  });
};
