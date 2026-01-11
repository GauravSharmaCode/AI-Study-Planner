// User Service - TypeScript Interfaces
// Domain-specific types for user management

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  password?: string; // Include password for internal operations
  isActive: boolean;
  isVerified: boolean;
  role: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  role: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: UserResponse;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface UserFilters extends PaginationParams {
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface UserListResponse {
  users: UserResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  status: 'error' | 'fail';
  message: string;
  statusCode: number;
}

export interface HealthResponse {
  status: 'success';
  message: string;
  service: string;
  timestamp: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}

// Configuration interfaces
export interface DatabaseConfig {
  url?: string;
  logQueries: boolean;
  logSlowQueries: boolean;
  slowQueryThreshold: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface CorsConfig {
  origin: string;
  credentials: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface LoggingConfig {
  level: string;
  format: string;
}

export interface SecurityConfig {
  bcryptRounds: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  serviceName: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

// Prisma middleware types
export interface PrismaQueryParams {
  model?: string;
  action: string;
  args?: any;
  dataPath?: string[];
  runInTransaction?: boolean;
}

export interface PrismaQueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

export interface PrismaLogEvent {
  timestamp: Date;
  message: string;
  target: string;
}
