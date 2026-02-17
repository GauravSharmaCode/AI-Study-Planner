import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger-wrapper";
import UserService from "../services/UserService";
import { signToken } from "../utils/auth";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import type { UserResponse } from "../interfaces";

/**
 * A higher-order function that wraps an asynchronous route handler,
 * allowing errors to be automatically passed to the next middleware.
 *
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} Express middleware function.
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Helper function to send a JSON response with a JWT token and user data.
 *
 * @param {UserResponse} user - The user object.
 * @param {number} statusCode - HTTP status code.
 * @param {Response} res - Express response object.
 * @param {string} [message="Authentication successful"] - Response message.
 */
const createSendToken = (
  user: UserResponse,
  statusCode: number,
  res: Response,
  message: string = "Authentication successful"
): void => {
  const token = signToken(user.id);

  // Ensure password is not included in the response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((user as any).password) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any).password = undefined;
  }

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user,
    },
  });
};

/**
 * POST /auth/register
 *
 * Registers a new user and issues a JWT token.
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const func = "authController.register";
  logger.entry(func, { email: req.body.email });

  const user = await UserService.createUser(req.body);

  logger.exit(func, { userId: user.id, email: user.email });

  // Generate token for immediate login after registration
  const token = signToken(user.id);

  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    token,
    data: {
      user,
    },
  });
});

/**
 * POST /auth/login
 *
 * Authenticates a user and issues a JWT token.
 * Requires email and password in the request body.
 */
const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const func = "authController.login";
    const { email, password } = req.body;

    logger.entry(func, { email });

    if (!email || !password) {
      logger.warn("Login failed: Email or password not provided", func, { email });
      return next(new AppError("Please provide email and password!", 400));
    }

    const user = await UserService.authenticateUser(email, password);

    logger.exit(func, { userId: user.id });

    createSendToken(user, 200, res, "Login successful");
  }
);

/**
 * GET /auth/logout
 *
 * Logs out a user (client-side token removal expected).
 */
const logout = (req: AuthenticatedRequest, res: Response): void => {
  const func = "authController.logout";
  logger.info("User logout", func, { userId: req.user?.id || "guest" });

  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
};

export { register, login, logout };
