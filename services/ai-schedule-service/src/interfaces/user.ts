export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  role: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  // ... other login properties
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface UserServiceRequest {
  action: 'CREATE_USER' | 'GET_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'VALIDATE_TOKEN';
  payload: any;
  userId?: string;
}

export interface UserServiceResponse {
  success: boolean;
  data?: User;
  error?: string;
}
