// ===================================================================
// MICROSERVICES COMMUNICATION TYPES
// ===================================================================

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: PaginationMeta;
}

// ===================================================================
// USER SERVICE TYPES
// ===================================================================

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

// ===================================================================
// AI SCHEDULE SERVICE TYPES
// ===================================================================

export interface StudyPlan {
  id: number;
  userId: string; // Reference to User service (no FK)
  exam: string;
  studyDuration: string;
  dailyHours: number;
  subjects: string[];
  optionals?: string[];
  studyStyle?: string[];
  numberOfAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyPreferences {
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  studyStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Schedule {
  id: number;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  studyPlanId: number;
  userId: string; // Reference to User service (no FK)
  dayNumber?: number;
  weekNumber?: number;
  focus: string;
  sessions: SessionData;
  breaks?: BreakData[];
  dailyTargets?: string[];
  weeklyTargets?: string[];
  metadata: ScheduleMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  set: Session[];
}

export interface Session {
  time: string;
  subject: string;
  topics: Topic[];
  type: 'STUDY' | 'REVISION' | 'TEST';
  duration: string;
  recommendedPace: string;
}

export interface Topic {
  name: string;
  type: 'NEW' | 'REVISION' | 'PRACTICE';
  difficulty: number;
  duration?: string;
  prerequisites?: string[];
  resources?: string[];
}

export interface BreakData {
  time: string;
  duration: string;
  type: 'SHORT' | 'LUNCH' | 'LONG' | 'RECREATION';
}

export interface ScheduleMetadata {
  currentDay?: number;
  totalDays?: number;
  currentWeek?: number;
  totalWeeks?: number;
  progress?: number;
  weekProgress?: number;
  dailyHours?: number;
  weeklyHours?: number;
  startDate?: string;
  endDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  revision?: boolean;
  weekType?: 'FOUNDATION' | 'CORE_CONCEPTS' | 'PRACTICE' | 'REVISION' | 'FINAL_REVISION';
}

export interface AIScheduleServiceRequest {
  action: 'CREATE_STUDY_PLAN' | 'GENERATE_SCHEDULE' | 'GET_SCHEDULES' | 'UPDATE_SCHEDULE' | 'DELETE_SCHEDULE';
  payload: any;
  userId: string;
}

export interface AIScheduleServiceResponse {
  success: boolean;
  data?: Schedule | StudyPlan | Schedule[];
  error?: string;
}

// ===================================================================
// INTER-SERVICE COMMUNICATION
// ===================================================================

export interface ServiceRequest<T = any> {
  serviceId: string;
  action: string;
  payload: T;
  userId?: string;
  requestId: string;
  timestamp: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
  timestamp: string;
  serviceId: string;
}

// Events for service communication
export interface ServiceEvent {
  eventType: string;
  serviceId: string;
  payload: any;
  timestamp: string;
  userId?: string;
}

// User events (published by User Service)
export interface UserCreatedEvent extends ServiceEvent {
  eventType: 'USER_CREATED';
  payload: {
    userId: string;
    email: string;
    name: string;
  };
}

export interface UserUpdatedEvent extends ServiceEvent {
  eventType: 'USER_UPDATED';
  payload: {
    userId: string;
    changes: Partial<User>;
  };
}

export interface UserDeletedEvent extends ServiceEvent {
  eventType: 'USER_DELETED';
  payload: {
    userId: string;
  };
}

// Study Plan events (published by AI Schedule Service)
export interface StudyPlanCreatedEvent extends ServiceEvent {
  eventType: 'STUDY_PLAN_CREATED';
  payload: {
    studyPlanId: number;
    userId: string;
    exam: string;
  };
}

export interface ScheduleGeneratedEvent extends ServiceEvent {
  eventType: 'SCHEDULE_GENERATED';
  payload: {
    scheduleId: number;
    studyPlanId: number;
    userId: string;
    type: string;
  };
}

// ===================================================================
// API GATEWAY TYPES
// ===================================================================

export interface GatewayRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceUrl: string;
  requiresAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface ServiceHealthCheck {
  serviceId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
}

// ===================================================================
// VALIDATION SCHEMAS
// ===================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ===================================================================
// LOGGING & MONITORING
// ===================================================================

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  serviceId: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  serviceId: string;
  tags?: Record<string, string>;
}
