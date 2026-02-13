import { Request, Response, NextFunction } from 'express';
import { logWithMeta } from '@gauravsharmacode/neat-logger';
import { AppError } from './errorHandler';
import { verifyToken, JwtPayload } from '../utils/auth';
import UserModel from '../models/UserModel';

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
      logWithMeta('No token found in request', { func, level: 'warn', extra: { ip: req.ip } });
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verification token
    const decoded: JwtPayload = await verifyToken(token);
    logWithMeta('Token verified', { func, level: 'debug', extra: { userId: decoded.id } });

    // 3) Check if user still exists
    const currentUser = await UserModel.findById(decoded.id);

    if (!currentUser) {
      logWithMeta('User for token not found', { func, level: 'warn', extra: { userId: decoded.id } });
      return next(
        new AppError('The user belonging to this token does no longer exist.', 401)
      );
    }

    if (!currentUser.isActive) {
      logWithMeta('User account is deactivated', { func, level: 'warn', extra: { userId: currentUser.id } });
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 401)
      );
    }

    // Grant access to protected route
    req.user = currentUser;
    logWithMeta('User authenticated and access granted', { func, level: 'info', extra: { userId: currentUser.id } });
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    logWithMeta('Authentication error in protect middleware', { 
      func, 
      level: 'error', 
      extra: { error: errorMessage, ip: req.ip } 
    });
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
      logWithMeta('User role restriction failed', { 
        func, 
        level: 'warn', 
        extra: { 
          userId: req.user.id, 
          userRole: req.user.role, 
          requiredRoles: roles 
        } 
      });
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    
    logWithMeta('User role authorized', { 
      func, 
      level: 'debug', 
      extra: { 
        userId: req.user.id, 
        role: req.user.role 
      } 
    });
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
        logWithMeta('Optional auth: User authenticated', { 
          func, 
          level: 'debug', 
          extra: { userId: currentUser.id } 
        });
      }
    }
  } catch (error) {
    // Ignore errors, just don't authenticate the user
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWithMeta('Optional auth: Token invalid, proceeding as guest', { 
      func, 
      level: 'debug', 
      extra: { error: errorMessage } 
    });
  }
  next();
};

export {
  protect,
  restrictTo,
  optionalAuth,
};

export type { AuthenticatedRequest };
