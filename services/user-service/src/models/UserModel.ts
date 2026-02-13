import { Prisma } from "@prisma/client";
import { logWithMeta } from "@gauravsharmacode/neat-logger";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserResponse,
  UserListResponse,
  UserFilters,
} from "../interfaces";
import { prisma } from "../config/database";

/**
 * Converts a user entity from the database to a UserResponse that can be returned
 * from the API.
 *
 * @param {object} user - The user entity from the database.
 * @returns {UserResponse} - The user response suitable for the API.
 */
const convertToUserResponse = (user: User): UserResponse => {
  const { ...userWithoutDeleted } = user;
  return {
    ...userWithoutDeleted,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    name: user.name || undefined,
    phone: user.phone || undefined,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  } as UserResponse;
};

// Prisma select fields for safe user data (without password)
const safeUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  name: true,
  phone: true,
  isActive: true,
  isVerified: true,
  role: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

// Prisma select fields including password (for authentication)
const userSelectWithPassword = {
  ...safeUserSelect,
  password: true,
} as const;

interface ExistsResult {
  exists: boolean;
  user?: User;
}

class UserModel {
  /**
   * Creates a new user in the database.
   *
   * @param userData - An object containing user data, including:
   *   - email: The user's email address.
   *   - password: The user's password (optional).
   *   - name: The user's full name (optional).
   *   - role: The user's role (optional, default is 'user').
   *   - isActive: Indicates if the user is active (optional, default is true).
   *   - isVerified: Indicates if the user is verified (optional, default is false).
   *
   * @returns A promise that resolves to the created user's response object.
   *
   * @throws Will throw an error if the user could not be created.
   */
  async create(
    userData: CreateUserRequest & {
      password?: string | null;
      name?: string;
      role?: string;
      isActive?: boolean;
      isVerified?: boolean;
    }
  ): Promise<UserResponse> {
    const func = "UserModel.create";
    try {
      logWithMeta("Creating user in database", {
        func,
        level: "info",
        extra: { email: userData.email },
      });

      // Ensure name is set - combine firstName and lastName if name not provided
      const createData = {
        ...userData,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email.split('@')[0] || 'User',
      };

      const user = await prisma.user.create({
        data: createData,
        select: safeUserSelect,
      });

      logWithMeta("User created in database", {
        func,
        level: "info",
        extra: { userId: user.id, email: user.email },
      });

      // Convert dates to strings for response
      return convertToUserResponse(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error creating user in database", {
        func,
        level: "error",
        extra: { error: errorMessage, email: userData.email },
      });
      throw error;
    }
  }

  /**
   * Finds a user by their ID.
   * @param userId - The ID of the user to find.
   * @param includeDeleted - Whether to include deleted users in the search (default false).
   * @returns The user object if found, or null otherwise.
   */
  async findById(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<UserResponse | null> {
    const func = "UserModel.findById";
    try {
      logWithMeta("Finding user by ID", {
        func,
        level: "debug",
        extra: { userId },
      });

      const whereClause: Prisma.UserWhereInput = { id: userId };
      if (!includeDeleted) {
        whereClause.deletedAt = null;
      }

      const user = await prisma.user.findFirst({
        where: whereClause,
        select: safeUserSelect,
      });

      if (user) {
        logWithMeta("User found by ID", {
          func,
          level: "debug",
          extra: { userId },
        });

        // Convert dates to strings for response
        return convertToUserResponse(user);
      }

      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error finding user by ID", {
        func,
        level: "error",
        extra: { error: errorMessage, userId },
      });
      throw error;
    }
  }

  /**
   * Finds a user by their email address
   * @param email The email address of the user to find
   * @param includePassword Whether to include the user's password in the result (default false)
   * @param includeDeleted Whether to include deleted users in the search (default false)
   * @returns The user object if found, or null otherwise
   */
  async findByEmail(
    email: string,
    includePassword: boolean = false,
    includeDeleted: boolean = false
  ): Promise<User | null> {
    const func = "UserModel.findByEmail";
    try {
      logWithMeta("Finding user by email", {
        func,
        level: "debug",
        extra: { email },
      });

      const whereClause: Prisma.UserWhereInput = { email };
      if (!includeDeleted) {
        whereClause.deletedAt = null;
      }

      const selectFields = includePassword
        ? userSelectWithPassword
        : safeUserSelect;

      const user = await prisma.user.findFirst({
        where: whereClause,
        select: selectFields,
      });

      if (user) {
        logWithMeta("User found by email", {
          func,
          level: "debug",
          extra: { email },
        });
      }

      return user as User | null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error finding user by email", {
        func,
        level: "error",
        extra: { error: errorMessage, email },
      });
      throw error;
    }
  }

  /**
   * Checks if a user exists with the given email and/or phone number.
   * Returns an object with `exists` property indicating whether the user exists
   * and `user` property with the existing user data if it does.
   * @param {Object} options - Options for checking user existence.
   * @param {string} options.email - Email address to check for.
   * @param {string} options.phone - Phone number to check for.
   * @returns {Promise<ExistsResult>} Promise resolving to an object indicating
   * whether the user exists and the existing user data if it does.
   */
  async checkExists({
    email,
    phone,
  }: {
    email?: string;
    phone?: string;
  }): Promise<ExistsResult> {
    const func = "UserModel.checkExists";
    try {
      logWithMeta("Checking if user exists", {
        func,
        level: "debug",
        extra: { email, phone },
      });

      const whereConditions = [];
      if (email) whereConditions.push({ email });
      if (phone) whereConditions.push({ phone });

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: whereConditions,
          deletedAt: null,
        },
        select: { id: true, email: true, phone: true },
      });

      const result: ExistsResult = {
        exists: !!existingUser,
        user: (existingUser as User) || undefined,
      };

      logWithMeta("User existence check completed", {
        func,
        level: "debug",
        extra: { exists: result.exists },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error checking user existence", {
        func,
        level: "error",
        extra: { error: errorMessage },
      });
      throw error;
    }
  }

  /**
   * Find many users with optional filters.
   * @param {UserFilters} filters - Optional filters for finding users.
   * @returns {Promise<UserListResponse>} - A promise that resolves with a list of users and pagination information.
   */
  async findMany(filters: UserFilters = {}): Promise<UserListResponse> {
    const func = "UserModel.findMany";
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
        includeDeleted = false,
      } = filters;

      const skip = (page - 1) * limit;

      logWithMeta("Finding users with filters", {
        func,
        level: "debug",
        extra: { page, limit, search, sortBy, sortOrder },
      });

      // Build where clause
      const whereClause: Prisma.UserWhereInput = {};

      if (!includeDeleted) {
        whereClause.deletedAt = null;
      }

      if (search) {
        whereClause.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get total count
      const total = await prisma.user.count({ where: whereClause });

      // Get users
      const users = await prisma.user.findMany({
        where: whereClause,
        select: safeUserSelect,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      });

      // Convert dates to strings for response
      const userResponses: UserResponse[] = users.map((user) => convertToUserResponse(user as User));

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: UserListResponse = {
        users: userResponses,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev,
        },
      };

      logWithMeta("Found users with filters", {
        func,
        level: "debug",
        extra: { count: users.length, total },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error finding users with filters", {
        func,
        level: "error",
        extra: { error: errorMessage },
      });
      throw error;
    }
  }

  /**
   * Updates a user in the database
   * @param userId The ID of the user to update
   * @param updateData The data to update the user with
   * @returns The updated user, or null if no user was found
   */
  async update(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<UserResponse | null> {
    const func = "UserModel.update";
    try {
      logWithMeta("Updating user in database", {
        func,
        level: "info",
        extra: { userId },
      });

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: safeUserSelect,
      });

      logWithMeta("User updated in database", {
        func,
        level: "info",
        extra: { userId },
      });

      // Convert dates to strings for response
      return convertToUserResponse(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error updating user in database", {
        func,
        level: "error",
        extra: { error: errorMessage, userId },
      });
      throw error;
    }
  }

  /**
   * Soft deletes a user by setting the deletedAt timestamp and deactivating the user.
   * @param userId - The ID of the user to soft delete.
   * @returns The updated user object with dates converted to strings, or null if no user was found.
   * @throws Will throw an error if the operation fails.
   */
  async softDelete(userId: string): Promise<UserResponse | null> {
    const func = "UserModel.softDelete";
    try {
      logWithMeta("Soft deleting user", {
        func,
        level: "info",
        extra: { userId },
      });

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
        select: safeUserSelect,
      });

      logWithMeta("User soft deleted", {
        func,
        level: "info",
        extra: { userId },
      });

      // Convert dates to strings for response
      return convertToUserResponse(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error soft deleting user", {
        func,
        level: "error",
        extra: { error: errorMessage, userId },
      });
      throw error;
    }
  }

  /**
   * Updates the last login timestamp for a user.
   * @param userId - The ID of the user whose last login timestamp is to be updated.
   * @returns A promise that resolves when the update is complete.
   * @throws Will throw an error if the update operation fails.
   */
  async updateLastLogin(userId: string): Promise<void> {
    const func = "UserModel.updateLastLogin";
    try {
      logWithMeta("Updating last login timestamp", {
        func,
        level: "debug",
        extra: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });

      logWithMeta("Last login timestamp updated", {
        func,
        level: "debug",
        extra: { userId },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logWithMeta("Error updating last login timestamp", {
        func,
        level: "error",
        extra: { error: errorMessage, userId },
      });
      throw error;
    }
  }
}

export default new UserModel();
