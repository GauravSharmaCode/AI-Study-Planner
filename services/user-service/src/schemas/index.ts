import { z } from 'zod';

// ===================================================================
// COMMON SCHEMAS
// ===================================================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string()
});
export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data?: T };

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
export type PaginatedResponse<T = unknown> = z.infer<typeof PaginatedResponseSchema> & { data?: T };

// ===================================================================
// INTER-SERVICE COMMUNICATION
// ===================================================================

export const ServiceRequestSchema = z.object({
  serviceId: z.string(),
  action: z.string(),
  payload: z.unknown(),
  userId: z.string().optional(),
  requestId: z.string(),
  timestamp: z.string()
});
export type ServiceRequest<T = unknown> = z.infer<typeof ServiceRequestSchema> & { payload: T };

export const ServiceResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  requestId: z.string(),
  timestamp: z.string(),
  serviceId: z.string()
});
export type ServiceResponse<T = unknown> = z.infer<typeof ServiceResponseSchema> & { data?: T };

export const ServiceEventSchema = z.object({
  eventType: z.string(),
  serviceId: z.string(),
  payload: z.unknown(),
  timestamp: z.string(),
  userId: z.string().optional()
});
export type ServiceEvent = z.infer<typeof ServiceEventSchema>;

// ===================================================================
// USER SERVICE SCHEMAS
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

export const CreateUserBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const UpdateUserBodySchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const LoginBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// REQUEST ENVELOPES
export const CreateUserRequestSchema = z.object({ body: CreateUserBodySchema });
export const UpdateUserRequestSchema = z.object({ body: UpdateUserBodySchema });
export const LoginRequestSchema = z.object({ body: LoginBodySchema });
export const ChangePasswordRequestSchema = z.object({ body: ChangePasswordBodySchema });
export const UserIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const PaginationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val: string | undefined) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val: string | undefined) => (val ? parseInt(val, 10) : 10)),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});


