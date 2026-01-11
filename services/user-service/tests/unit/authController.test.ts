import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthController } from '../../src/controllers/authController';
import { UserService } from '../../src/services/UserService';

// Mock dependencies
jest.mock('../../src/services/UserService');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        }
      };
    });

    it('should register a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockToken = 'jwt-token-123';

      mockUserService.findUserByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue(mockToken as never);

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User registered successfully',
        token: mockToken,
        data: { user: expect.objectContaining({ email: 'test@example.com' }) }
      });
    });

    it('should return error if user already exists', async () => {
      // Arrange
      const existingUser = { id: '1', email: 'test@example.com' };
      mockUserService.findUserByEmail.mockResolvedValue(existingUser as any);

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User already exists with this email'
      });
    });

    it('should return error for missing required fields', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com' }; // Missing password, firstName, lastName

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email, password, firstName, and lastName are required'
      });
    });
  });

  describe('login', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
    });

    it('should login user successfully', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true
      };
      const mockToken = 'jwt-token-123';

      mockUserService.findUserByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockUserService.updateUser.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() } as any);
      mockJwt.sign.mockReturnValue(mockToken as never);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Login successful',
        token: mockToken,
        data: { user: expect.objectContaining({ email: 'test@example.com' }) }
      });
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword123'
      };

      mockUserService.findUserByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid email or password'
      });
    });

    it('should return error if user not found', async () => {
      // Arrange
      mockUserService.findUserByEmail.mockResolvedValue(null);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid email or password'
      });
    });
  });
});
