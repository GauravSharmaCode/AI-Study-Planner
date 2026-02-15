import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger-wrapper';
import { AppError } from './errorHandler';
import { verifyToken, JwtPayload } from '../utils/auth';
import UserModel from '../models/UserModel';
import { contextStore } from '../utils/context';

import { UserResponse } from '../interfaces';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: UserResponse;
}

const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const func = 'protectMiddleware';
  try {
    // 1) Getting token and check if it's there
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn('No token found in request', func, { ip: req.ip });
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verification token
    const decoded: JwtPayload = await verifyToken(token);
    logger.debug('Token verified', func, { userId: decoded.id });

    // 3) Check if user still exists
    const currentUser = await UserModel.findById(decoded.id);

    if (!currentUser) {
      logger.warn('User for token not found', func, { userId: decoded.id });
      return next(
        new AppError('The user belonging to this token does no longer exist.', 401)
      );
    }

    if (!currentUser.isActive) {
      logger.warn('User account is deactivated', func, { userId: currentUser.id });
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 401)
      );
    }

    // Grant access to protected route
    req.user = currentUser;

    // Update context
    const store = contextStore.getStore();
    if (store) {
      store.userId = currentUser.id;
    }

    logger.info('User authenticated and access granted', func, { userId: currentUser.id });
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    logger.error('Authentication error in protect middleware', func, { error: errorMessage, ip: req.ip });
    next(error);
  }
};

const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const func = 'restrictToMiddleware';
    
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('User role restriction failed', func, {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles
      });
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    
    logger.debug('User role authorized', func, { userId: req.user.id, role: req.user.role });
    next();
  };
};

const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const func = 'optionalAuthMiddleware';
  try {
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded: JwtPayload = await verifyToken(token);
      const currentUser = await UserModel.findById(decoded.id);
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;

        // Update context
        const store = contextStore.getStore();
        if (store) {
          store.userId = currentUser.id;
        }

        logger.debug('Optional auth: User authenticated', func, { userId: currentUser.id });
      }
    }
  } catch (error) {
    // Ignore errors, just don't authenticate the user
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.debug('Optional auth: Token invalid, proceeding as guest', func, { error: errorMessage });
  }
  next();
};

export {
  protect,
  restrictTo,
  optionalAuth,
};

export type { AuthenticatedRequest };
