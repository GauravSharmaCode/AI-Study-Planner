import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { VerifyErrors } from 'jsonwebtoken';
import { logWithMeta } from '@gauravsharmacode/neat-logger';
import config from '../config';

// JWT payload interface
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const func = 'hashPassword';
  try {
    const hash = await bcrypt.hash(password, config.security.bcryptRounds);
    logWithMeta('Password hashed successfully', { func, level: 'debug' });
    return hash;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWithMeta('Error hashing password', { func, level: 'error', extra: { error: errorMessage } });
    throw error;
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param candidatePassword - Plain text password
 * @param userPassword - Hashed password
 * @returns True if passwords match
 */
export const correctPassword = async (candidatePassword: string, userPassword: string): Promise<boolean> => {
  const func = 'correctPassword';
  try {
    const isValid = await bcrypt.compare(candidatePassword, userPassword);
    logWithMeta('Password comparison completed', { func, level: 'debug', extra: { isValid } });
    return isValid;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWithMeta('Error comparing passwords', { func, level: 'error', extra: { error: errorMessage } });
    throw error;
  }
};

/**
 * Generate a JWT token for a user
 * @param userId - User ID
 * @returns JWT token
 */
export const signToken = (userId: string): string => {
  const func = 'signToken';
  try {
    const payload = { id: userId };
    // Use jwt.sign with the correct overload
    const token = jwt.sign(payload, config.jwt.secret);
    logWithMeta('JWT signed successfully', { func, level: 'info', extra: { userId } });
    return token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWithMeta('Error signing JWT', { func, level: 'error', extra: { error: errorMessage, userId } });
    throw new Error('Error signing token');
  }
};

/**
 * Verify a JWT token
 * @param token - JWT token
 * @returns Decoded payload
 */
export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const func = 'verifyToken';
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err: VerifyErrors | null, decoded: any) => {
      if (err) {
        logWithMeta('JWT verification failed', { func, level: 'warn', extra: { error: err.message } });
        return reject(new Error('Failed to authenticate token'));
      }
      logWithMeta('JWT verified successfully', { func, level: 'debug', extra: { userId: decoded.id } });
      resolve(decoded as JwtPayload);
    });
  });
};
