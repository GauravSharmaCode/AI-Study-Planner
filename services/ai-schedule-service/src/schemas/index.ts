import { z } from 'zod';

// ===================================================================
// STUDY PLAN SCHEMAS
// ===================================================================

export const CreateStudyPlanSchema = z.object({
  body: z.object({
    subjects: z.array(z.string()).min(1, 'At least one subject is required'),
    availableHoursPerDay: z.number().min(0.5, 'Minimum 0.5 hours per day').max(12, 'Maximum 12 hours per day'),
    targetCompletionDate: z.string().refine(
      (val: string) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d > new Date();
      },
      { message: 'Must be a valid future date' }
    ),
    examName: z.string().optional(),
    preferredStartTime: z.string()
      .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format')
      .optional()
      .default('08:00'),
  }),
});

export const GetStudyPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid study plan ID format'),
  }),
});

export const UpdateStudyPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid study plan ID format'),
  }),
  body: z.object({
    examName: z.string().optional(),
    subjects: z.array(z.string()).min(1).optional(),
    availableHoursPerDay: z.number().min(0.5).max(12).optional(),
    preferredStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    targetCompletionDate: z.string().refine(
      (val: string) => !isNaN(Date.parse(val)),
      { message: 'Invalid date format' }
    ).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
});

export const DeleteStudyPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid study plan ID format'),
  }),
});

// ===================================================================
// SESSION SCHEMAS
// ===================================================================

export const UpdateSessionStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    status: z.enum(['pending', 'completed', 'skipped', 'partial'], {
      message: 'Status must be pending, completed, skipped, or partial',
    }),
    completedMinutes: z.number().int().min(0).optional(),
    remarks: z.string().optional(),
  }),
});

export const UpdateSessionRemarksSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid session ID format'),
  }),
  body: z.object({
    remarks: z.string().min(1, 'Remarks cannot be empty'),
  }),
});

// ===================================================================
// RESCHEDULE SCHEMA
// ===================================================================

export const RescheduleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid study plan ID format'),
  }),
});

// GetAllPlansSchema removed — userId is resolved from JWT token internally

export const GetAnalyticsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid study plan ID format'),
  }),
});

// ===================================================================
// SERVICE COMMUNICATION TYPES (for backward compatibility)
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
