import { z } from 'zod';

// ===================================================================
// MICROSERVICES COMMUNICATION SCHEMAS
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

// Events for service communication
export const ServiceEventSchema = z.object({
  eventType: z.string(),
  serviceId: z.string(),
  payload: z.any(),
  timestamp: z.string(),
  userId: z.string().optional()
});

export type ServiceEvent = z.infer<typeof ServiceEventSchema>;

// ===================================================================
// AI SCHEDULE SERVICE TYPES
// ===================================================================

// Matches Prisma Model in ai-schedule-service/prisma/schema.prisma
export const StudyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjects: z.array(z.string()),
  availableHoursPerDay: z.number(),
  targetCompletionDate: z.union([z.date(), z.string()]),
  plan: z.any(), // JSON structure
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
});

export type StudyPlan = z.infer<typeof StudyPlanSchema>;

export const StudySessionSchema = z.object({
  id: z.string(),
  studyPlanId: z.string(),
  date: z.string(),
  topic: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.string(), // pending, completed, skipped
  remarks: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()])
});

export type StudySession = z.infer<typeof StudySessionSchema>;
