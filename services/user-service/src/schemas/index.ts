import { z } from 'zod';

// ===================================================================
// COMMON SCHEMAS
// ===================================================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string()
});
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T };

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const PaginatedResponseSchema = ApiResponseSchema.extend({
  meta: PaginationMetaSchema
});
export type PaginatedResponse<T = any> = z.infer<typeof PaginatedResponseSchema> & { data?: T };

// ===================================================================
// USER SERVICE TYPES
// ===================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  role: z.string(),
  lastLoginAt: z.union([z.date(), z.string()]).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  deletedAt: z.union([z.date(), z.string()]).optional().nullable()
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional()
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  expiresIn: z.number()
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const UserServiceRequestSchema = z.object({
  action: z.enum(['CREATE_USER', 'GET_USER', 'UPDATE_USER', 'DELETE_USER', 'VALIDATE_TOKEN']),
  payload: z.any(),
  userId: z.string().optional()
});
export type UserServiceRequest = z.infer<typeof UserServiceRequestSchema>;

export const UserServiceResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  error: z.string().optional()
});
export type UserServiceResponse = z.infer<typeof UserServiceResponseSchema>;

// ===================================================================
// LOGGING & MONITORING
// ===================================================================

export const LogEntrySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  timestamp: z.string(),
  serviceId: z.string(),
  userId: z.string().optional(),
  requestId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional() // Fixed usage of z.record
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

export const MetricDataSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string(),
  serviceId: z.string(),
  tags: z.record(z.string(), z.string()).optional() // Fixed usage of z.record
});
export type MetricData = z.infer<typeof MetricDataSchema>;

// ===================================================================
// INTER-SERVICE COMMUNICATION
// ===================================================================

export const ServiceRequestSchema = z.object({
  serviceId: z.string(),
  action: z.string(),
  payload: z.any(),
  userId: z.string().optional(),
  requestId: z.string(),
  timestamp: z.string()
});
export type ServiceRequest<T = any> = z.infer<typeof ServiceRequestSchema> & { payload: T };

export const ServiceResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  requestId: z.string(),
  timestamp: z.string(),
  serviceId: z.string()
});
export type ServiceResponse<T = any> = z.infer<typeof ServiceResponseSchema> & { data?: T };

export const ServiceEventSchema = z.object({
  eventType: z.string(),
  serviceId: z.string(),
  payload: z.any(),
  timestamp: z.string(),
  userId: z.string().optional()
});
export type ServiceEvent = z.infer<typeof ServiceEventSchema>;
