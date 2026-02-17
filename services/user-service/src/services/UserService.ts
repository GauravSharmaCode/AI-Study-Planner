import { Prisma } from "@prisma/client"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { logger } from "../utils/logger-wrapper";
import { hashPassword, correctPassword } from "../utils/auth";
import UserModel from "../models/UserModel";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UserListResponse,
  UserFilters,
  User,
} from "../interfaces";

interface ServiceError extends Error {
  statusCode?: number;
}

/**
 * Service class for handling user-related business logic.
 *
 * Handles creation, retrieval, updates, authentication, and deletion of users.
 */
class UserService {
  /**
   * Creates a new user.
   *
   * Checks for existing user by email or phone.
   * Hashes the password if provided.
   *
   * @param {CreateUserRequest} userData - The user creation data.
   * @returns {Promise<UserResponse>} The created user.
   * @throws {ServiceError} If user already exists (409) or other errors.
   */
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    const func = "createUser";
    try {
      logger.entry(func, { email: userData.email });

      const checkData: { email?: string; phone?: string } = {
        email: userData.email,
      };
      if (userData.phone) {
        checkData.phone = userData.phone;
      }

      const { exists, user: existingUser } =
        await UserModel.checkExists(checkData);

      if (exists && existingUser) {
        const conflictField =
          existingUser.email === userData.email ? "email" : "phone";
        const error: ServiceError = new Error(
          `User with this ${conflictField} already exists`
        );
        error.statusCode = 409;
        throw error;
      }

      let hashedPassword: string | null = null;
      if (userData.password) {
        hashedPassword = await hashPassword(userData.password);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userCreateData: any = {
        email: userData.email,
        role: "user",
        isActive: true,
        isVerified: false,
      };

      // Add optional fields only if they exist
      if (hashedPassword) userCreateData.password = hashedPassword;
      if (userData.firstName) userCreateData.firstName = userData.firstName;
      if (userData.lastName) userCreateData.lastName = userData.lastName;
      if (userData.phone) userCreateData.phone = userData.phone;

      // Add computed name if firstName or lastName exists
      if (userData.firstName || userData.lastName) {
        userCreateData.name =
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
      }

      const newUser: UserResponse = await UserModel.create(userCreateData);

      logger.exit(func, { userId: newUser.id, email: newUser.email });
      return newUser;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error creating user", func, { error: errorMessage, email: userData.email });
      throw error;
    }
  }

  /**
   * Retrieves a user by their ID.
   *
   * @param {string} userId - The user ID.
   * @param {boolean} [includeDeleted=false] - Whether to include soft-deleted users.
   * @returns {Promise<UserResponse | null>} The user object.
   * @throws {ServiceError} If user is not found (404).
   */
  async getUserById(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<UserResponse | null> {
    const func = "getUserById";
    try {
      logger.entry(func, { userId, includeDeleted });

      const user: UserResponse | null = await UserModel.findById(
        userId,
        includeDeleted
      );

      if (!user) {
        const error: ServiceError = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      logger.exit(func, { userId });
      return user;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error fetching user", func, { error: errorMessage, userId });
      throw error;
    }
  }

  /**
   * Retrieves a list of users based on filters.
   *
   * @param {UserFilters} [filters={}] - Filters for pagination, search, etc.
   * @returns {Promise<UserListResponse>} List of users and pagination metadata.
   */
  async getAllUsers(filters: UserFilters = {}): Promise<UserListResponse> {
    const func = "getAllUsers";
    try {
      logger.entry(func, { filters });

      const result: UserListResponse = await UserModel.findMany(filters);

      logger.exit(func, { count: result.users.length, total: result.pagination.total });
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error fetching users", func, { error: errorMessage });
      throw error;
    }
  }

  /**
   * Updates an existing user.
   *
   * @param {string} userId - The user ID.
   * @param {UpdateUserRequest} updateData - Data to update.
   * @returns {Promise<UserResponse | null>} The updated user.
   * @throws {ServiceError} If user not found (404).
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<UserResponse | null> {
    const func = "updateUser";
    try {
      logger.entry(func, { userId, updateData });

      const updatedUser: UserResponse | null = await UserModel.update(
        userId,
        updateData
      );

      if (!updatedUser) {
        const error: ServiceError = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      logger.exit(func, { userId });
      return updatedUser;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error updating user", func, { error: errorMessage, userId });
      throw error;
    }
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param {string} email - User email.
   * @param {string} inputPassword - User password.
   * @returns {Promise<UserResponse>} The authenticated user (without password).
   * @throws {ServiceError} If credentials invalid (401) or account inactive.
   */
  async authenticateUser(
    email: string,
    inputPassword: string
  ): Promise<UserResponse> {
    const func = "authenticateUser";
    try {
      logger.entry(func, { email });

      const user: User | null = await UserModel.findByEmail(email, true);
      if (!user) {
        const error: ServiceError = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
      }

      if (!user.isActive) {
        const error: ServiceError = new Error(
          "Account is deactivated. Please contact support."
        );
        error.statusCode = 401;
        throw error;
      }

      if (
        !user.password ||
        !(await correctPassword(inputPassword, user.password))
      ) {
        const error: ServiceError = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
      }

      await UserModel.updateLastLogin(user.id);

      // Remove password and convert to response format
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userFields } = user;

      const userResponse: UserResponse = {
        ...userFields,
        lastLoginAt: userFields.lastLoginAt?.toISOString(),
        createdAt: userFields.createdAt.toISOString(),
        updatedAt: userFields.updatedAt.toISOString(),
      } as UserResponse;

      logger.exit(func, { email, userId: user.id });
      return userResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error authenticating user", func, { error: errorMessage, email });
      throw error;
    }
  }

  /**
   * Soft deletes a user (sets isActive to false and adds deletedAt timestamp).
   *
   * @param {string} userId - The user ID.
   * @returns {Promise<UserResponse | null>} The deleted user record.
   */
  async softDeleteUser(userId: string): Promise<UserResponse | null> {
    const func = "softDeleteUser";
    try {
      logger.entry(func, { userId });

      const updatedUser: UserResponse | null =
        await UserModel.softDelete(userId);

      logger.exit(func, { userId });
      return updatedUser;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error soft deleting user", func, { error: errorMessage, userId });
      throw error;
    }
  }
}

export default new UserService();
