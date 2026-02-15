import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { createLogger } from '../utils/logger';
import { contextStore } from '../utils/context';

const logger = createLogger('auth-middleware');

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Protect middleware — verifies JWT and extracts userId.
 * Must be applied to all routes that need authenticated access.
 */
export function protect(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET is not configured');
      throw new AppError('Server configuration error', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded.id) {
      throw new AppError('Invalid token: missing user ID', 401);
    }

    req.userId = decoded.id;

    // Update context
    const store = contextStore.getStore();
    if (store) {
      store.userId = decoded.id;
    }

    logger.debug('User authenticated', {
      userId: decoded.id,
      correlationId: req.correlationId,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(new AppError('Authentication failed', 401));
  }
}
