import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { body, param, query, validationResult } = require("express-validator");

/**
 * Handles validation errors by calling next() with an AppError
 * containing all error messages joined by '. '.
 * If there are no errors, calls next() without arguments.
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware function
 */
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: any) => error.msg);
    return next(new AppError(errorMessages.join(". "), 400));
  }
  next();
};

const userValidation = {
  create: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    body("firstName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be between 1 and 50 characters"),
    body("lastName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be between 1 and 50 characters"),
    body("phone")
      .optional()
      .isMobilePhone("any")
      .withMessage("Please provide a valid phone number"),
    body("role")
      .optional()
      .isIn(["user", "admin", "moderator"])
      .withMessage("Invalid role specified"),
    handleValidationErrors,
  ],

  update: [
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("firstName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be between 1 and 50 characters"),
    body("lastName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be between 1 and 50 characters"),
    body("phone")
      .optional()
      .isMobilePhone("any")
      .withMessage("Please provide a valid phone number"),
    body("role")
      .optional()
      .isIn(["user", "admin", "moderator"])
      .withMessage("Invalid role specified"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
    body("isVerified")
      .optional()
      .isBoolean()
      .withMessage("isVerified must be a boolean value"),
    handleValidationErrors,
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    body("confirmPassword").custom((value: string, { req }: any) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
    handleValidationErrors,
  ],

  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],

  params: [
    param("id").isUUID().withMessage("Invalid user ID format"),
    handleValidationErrors,
  ],
};

const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn([
      "createdAt",
      "updatedAt",
      "email",
      "firstName",
      "lastName",
      "lastLoginAt",
    ])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  query("isVerified")
    .optional()
    .isBoolean()
    .withMessage("isVerified must be a boolean value"),
  query("role")
    .optional()
    .isIn(["user", "admin", "moderator"])
    .withMessage("Invalid role specified"),
  handleValidationErrors,
];

export { userValidation, paginationValidation, handleValidationErrors };
