import { Request, Response, NextFunction } from "express";
import { logWithMeta } from "@gauravsharmacode/neat-logger";
import UserService from "../services/UserService";
import { signToken } from "../utils/auth";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import type { UserResponse } from "../interfaces";

/**
 * A higher-order function that wraps an asynchronous route handler,
 * allowing errors to be automatically passed to the next middleware.
 *
 * @param {Function} fn - An asynchronous function that takes Express
 * request, response, and next function as parameters.
 * @returns {Function} A new function that executes the given async
 * function and catches any errors, passing them to the next middleware.
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Helper function to send a JSON response with a JWT token and user data
 * (minus password) after a successful authentication.
 *
 * @param {Object} user - The user document to send in the response.
 * @param {Number} statusCode - The HTTP status code to send.
 * @param {Object} res - The Express Response object to send with.
 * @param {string} message - Success message to include in response.
 */
const createSendToken = (
  user: UserResponse,
  statusCode: number,
  res: Response,
  message: string = "Authentication successful"
): void => {
  const token = signToken(user.id);

  // Ensure password is not included in the response
  // Although UserResponse interface doesn't include password, the runtime object might
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

const register = catchAsync(async (req: Request, res: Response) => {
  const func = "authController.register";
  logWithMeta("Registration attempt", {
    func,
    level: "info",
    extra: { email: req.body.email },
  });

  const user = await UserService.createUser(req.body);

  logWithMeta("Registration successful", {
    func,
    level: "info",
    extra: {
      email: req.body.email,
      userId: user.id,
    },
  });

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

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const func = "authController.login";
    const { email, password } = req.body;

    logWithMeta("Login attempt", { func, level: "info", extra: { email } });

    if (!email || !password) {
      logWithMeta("Login failed: Email or password not provided", {
        func,
        level: "warn",
        extra: { email },
      });
      return next(new AppError("Please provide email and password!", 400));
    }

    const user = await UserService.authenticateUser(email, password);

    logWithMeta("Login successful", {
      func,
      level: "info",
      extra: {
        email,
        userId: user.id,
      },
    });

    createSendToken(user, 200, res, "Login successful");
  }
);

/**
 * Logs the user out by deleting the JWT token on the client-side.
 * If you are using a token blacklist, you should add the token to it here.
 *
 * @param {AuthenticatedRequest} req - The request object with the authenticated user.
 * @param {Response} res - The response object.
 */
const logout = (req: AuthenticatedRequest, res: Response): void => {
  const func = "authController.logout";
  // For JWT, logout is typically handled client-side by deleting the token.
  // If using a token blacklist, you would add the token to it here.
  logWithMeta("User logout", {
    func,
    level: "info",
    extra: { userId: req.user?.id || "guest" },
  });
  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
};

export { register, login, logout };
