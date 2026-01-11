import UserService from '../../src/services/UserService';
import UserModel from '../../src/models/UserModel';
import * as authUtils from '../../src/utils/auth';
import { CreateUserRequest, UpdateUserRequest } from '../../src/interfaces';

// Mock dependencies
jest.mock('../../src/models/UserModel');
jest.mock('../../src/utils/auth');

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData: CreateUserRequest = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890'
    };

    it('should create a user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        phone: '+1234567890',
        isActive: true,
        isVerified: false,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.checkExists = jest.fn().mockResolvedValue({ exists: false, user: null });
      mockAuthUtils.hashPassword = jest.fn().mockResolvedValue(hashedPassword);
      mockUserModel.create = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await UserService.createUser(validUserData);

      // Assert
      expect(mockUserModel.checkExists).toHaveBeenCalledWith({
        email: validUserData.email,
        phone: validUserData.phone
      });
      expect(mockAuthUtils.hashPassword).toHaveBeenCalledWith(validUserData.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user email already exists', async () => {
      // Arrange
      const existingUser = { id: '1', email: 'test@example.com', phone: null };
      mockUserModel.checkExists = jest.fn().mockResolvedValue({ exists: true, user: existingUser });

      // Act & Assert
      await expect(UserService.createUser(validUserData))
        .rejects
        .toThrow('User with this email already exists');
      
      expect(mockAuthUtils.hashPassword).not.toHaveBeenCalled();
    });

    it('should create user without optional fields', async () => {
      // Arrange
      const minimalUserData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123'
      };
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        isActive: true,
        isVerified: false,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.checkExists = jest.fn().mockResolvedValue({ exists: false, user: null });
      mockAuthUtils.hashPassword = jest.fn().mockResolvedValue(hashedPassword);
      mockUserModel.create = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await UserService.createUser(minimalUserData);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });

  describe('authenticateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should authenticate user successfully', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword123',
        isActive: true,
        firstName: 'John',
        lastName: 'Doe',
        lastLoginAt: null
      };

      mockUserModel.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockAuthUtils.correctPassword = jest.fn().mockResolvedValue(true);
      mockUserModel.updateLastLogin = jest.fn().mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

      // Act
      const result = await UserService.authenticateUser(email, password);

      // Assert
      expect(mockUserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(mockAuthUtils.correctPassword).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserModel.findByEmail = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.authenticateUser(email, password))
        .rejects
        .toThrow('Invalid email or password');
      
      expect(mockAuthUtils.correctPassword).not.toHaveBeenCalled();
    });

    it('should throw error if user is inactive', async () => {
      // Arrange
      const inactiveUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword123',
        isActive: false
      };
      mockUserModel.findByEmail = jest.fn().mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(UserService.authenticateUser(email, password))
        .rejects
        .toThrow('Account is deactivated. Please contact support.');
    });

    it('should throw error if password is incorrect', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword123',
        isActive: true
      };
      mockUserModel.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockAuthUtils.correctPassword = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(UserService.authenticateUser(email, password))
        .rejects
        .toThrow('Invalid email or password');
    });
  });

  describe('getUserById', () => {
    it('should return user successfully', async () => {
      // Arrange
      const userId = '1';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      mockUserModel.findById = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getUserById(userId);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '999';
      mockUserModel.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getUserById(userId))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    const userId = '1';
    const updateData: UpdateUserRequest = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+9876543210'
    };

    it('should update user successfully', async () => {
      // Arrange
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      };
      const updatedUser = {
        ...existingUser,
        ...updateData,
        name: 'Jane Smith'
      };

      mockUserModel.findById = jest.fn().mockResolvedValue(existingUser);
      mockUserModel.checkExists = jest.fn().mockResolvedValue({ exists: false, user: null });
      mockUserModel.update = jest.fn().mockResolvedValue(updatedUser);

      // Act
      const result = await UserService.updateUser(userId, updateData);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if phone already exists for another user', async () => {
      // Arrange
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        phone: '+1234567890'
      };
      const conflictUser = {
        id: '2',
        email: 'other@example.com',
        phone: '+9876543210'
      };

      mockUserModel.findById = jest.fn().mockResolvedValue(existingUser);
      mockUserModel.checkExists = jest.fn().mockResolvedValue({ exists: true, user: conflictUser });

      // Act & Assert
      await expect(UserService.updateUser(userId, updateData))
        .rejects
        .toThrow('Phone number already exists for another user');
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const userId = '1';
      const deletedUser = {
        id: '1',
        email: 'test@example.com',
        isActive: false,
        deletedAt: new Date()
      };

      mockUserModel.softDelete = jest.fn().mockResolvedValue(deletedUser);

      // Act
      const result = await UserService.softDeleteUser(userId);

      // Assert
      expect(mockUserModel.softDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(deletedUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users list', async () => {
      // Arrange
      const filters = {
        page: 1,
        limit: 10,
        search: 'john',
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      };
      const mockResponse = {
        users: [
          { id: '1', email: 'john@example.com', firstName: 'John' },
          { id: '2', email: 'johnny@example.com', firstName: 'Johnny' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      mockUserModel.findManyWithPagination = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await UserService.getAllUsers(filters);

      // Assert
      expect(mockUserModel.findManyWithPagination).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResponse);
    });
  });
});
