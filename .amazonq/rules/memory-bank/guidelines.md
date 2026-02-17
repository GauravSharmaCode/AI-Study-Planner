# Development Guidelines

## Code Quality Standards

### TypeScript Configuration
- **Target**: ES2022 with CommonJS modules
- **Strict Mode**: Enabled with comprehensive strict checks
  - `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`
  - `noImplicitReturns`, `noFallthroughCasesInSwitch`
  - `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Module Resolution**: Node with esModuleInterop
- **Source Maps**: Enabled for debugging
- **Decorators**: Experimental decorators enabled

### ESLint Standards
- **Environment**: Node.js, ES2022, Jest
- **Parser**: @typescript-eslint/parser with TypeScript project support
- **Rules**:
  - `no-console`: warn (use structured logging instead)
  - `@typescript-eslint/no-unused-vars`: error
  - `@typescript-eslint/no-explicit-any`: warn (minimize usage)
  - Explicit return types: off (rely on inference)
  - Module boundary types: off
- **Ignored**: dist/, node_modules/

### File Organization
- **Controllers**: Request handlers in `src/controllers/`
- **Services**: Business logic in `src/services/`
- **Middleware**: Express middleware in `src/middleware/`
- **Routes**: API route definitions in `src/routes/`
- **Utils**: Utility functions in `src/utils/`
- **Schemas**: Zod validation schemas in `src/schemas/`
- **Interfaces**: TypeScript interfaces in `src/interfaces/`
- **Config**: Configuration in `src/config/`
- **Tests**: Unit tests in `tests/unit/`, integration in `tests/integration/`

## Architectural Patterns

### Controller Pattern
```typescript
// Use class-based controllers with catchAsync wrapper
export class StudyPlanController {
  generateStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const userId = req.userId!; // From JWT middleware
    const result = await studyPlanService.createPlan({...});
    
    res.status(201).json({
      status: 'success',
      data: result,
    });
  });
}

export default new StudyPlanController();
```

### Service Layer Pattern
- Business logic isolated in service classes/modules
- Services handle database operations via Prisma
- Services throw AppError for operational errors
- Services return clean data objects (no HTTP concerns)

### Error Handling Pattern
```typescript
// Custom AppError class for operational errors
export class AppError extends Error {
  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Use catchAsync wrapper for async route handlers
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
```

### Middleware Patterns

#### Authentication Middleware
```typescript
// JWT verification with context updates
export function protect(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError('Authentication required', 401);
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  req.userId = decoded.id;
  
  // Update async context
  const store = contextStore.getStore();
  if (store) store.userId = decoded.id;
  
  next();
}
```

#### Request Validation
```typescript
// Zod schema validation middleware
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    
    if (!result.success) {
      return next(new AppError(result.error.errors[0].message, 400));
    }
    next();
  };
};
```

## Logging Standards

### Structured Logging
```typescript
// Winston-based logger with context injection
const logger = createLogger('service-name');

// Entry/Exit logging pattern
logger.entry('functionName', { userId, subjects });
// ... function logic
logger.exit('functionName', { planId: result.planId });

// State change logging
logger.stateChange('functionName', 'status', 'pending', 'completed');

// Standard log levels
logger.info('message', { meta });
logger.warn('message', { meta });
logger.error('message', { meta });
logger.debug('message', { meta });
```

### Context Propagation
- Use AsyncLocalStorage for correlation IDs and user IDs
- Automatically inject context into all log entries
- Context includes: `correlationId`, `userId`

### Sensitive Data Sanitization
```typescript
// Recursive sanitization of sensitive fields
export const MASKED_FIELDS = [
  "password", "passwordConfirm", "token",
  "accessToken", "refreshToken", "authorization", "clientSecret"
];

export const sanitize = (obj: any): any => {
  // Recursively mask sensitive fields
  // Arrays and nested objects handled
  // Returns new object with masked values
};
```

## Validation Standards

### Zod Schema Patterns
```typescript
// Request envelope pattern
export const CreateStudyPlanSchema = z.object({
  body: z.object({
    subjects: z.array(z.string()).min(1, 'At least one subject is required'),
    availableHoursPerDay: z.number().min(0.5).max(12),
    targetCompletionDate: z.string().refine(
      (val) => new Date(val) > new Date(),
      { message: 'Must be a valid future date' }
    ),
    examName: z.string().optional(),
    preferredStartTime: z.string()
      .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format')
      .optional()
      .default('08:00'),
  }),
});

// UUID validation for IDs
z.string().uuid('Invalid ID format')

// Enum validation
z.enum(['pending', 'completed', 'skipped', 'partial'])

// Custom refinements for complex validation
.refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
})
```

### Type Inference
```typescript
// Export inferred types from schemas
export type ServiceRequest<T = any> = z.infer<typeof ServiceRequestSchema> & { payload: T };
export type User = z.infer<typeof UserSchema>;
```

## API Response Standards

### Success Response Format
```typescript
res.status(200).json({
  status: 'success',
  data: result,
  results: items.length, // For arrays
});
```

### Error Response Format
```typescript
res.status(statusCode).json({
  status: 'fail' | 'error', // 4xx = fail, 5xx = error
  message: 'Error message',
  // Development only:
  stack: err.stack,
  details: err.details
});
```

## Database Patterns

### Prisma Usage
- Use Prisma Client for all database operations
- Generate client after schema changes: `npx prisma generate`
- Run migrations: `npx prisma migrate dev` (dev) or `npx prisma migrate deploy` (prod)
- Type-safe queries with full TypeScript support

### Transaction Patterns
```typescript
await prisma.$transaction(async (tx) => {
  // Multiple operations in transaction
  const plan = await tx.studyPlan.create({...});
  const sessions = await tx.session.createMany({...});
  return { plan, sessions };
});
```

## Testing Standards

### Test Organization
- **Unit Tests**: `tests/unit/` - Test individual functions/classes
- **Integration Tests**: `tests/integration/` - Test API endpoints
- **Test Setup**: `tests/setup.ts` - Shared test configuration

### Jest Configuration
- Framework: Jest with ts-jest preprocessor
- Coverage: Enabled with coverage reports
- Environment: Node.js
- Pass with no tests: Enabled for incremental development

## Security Standards

### Authentication
- JWT tokens with configurable expiration
- Bearer token format: `Authorization: Bearer <token>`
- Token verification on protected routes
- User ID extraction from JWT payload

### Password Security
- bcrypt hashing with 12 rounds (configurable)
- Never log or return passwords in responses
- Password validation: minimum 8 characters

### Input Sanitization
- Zod validation on all inputs
- Sanitize sensitive fields in logs
- Validate UUIDs, emails, dates, enums

### Security Headers
- Helmet.js for security headers
- CORS configuration with allowed origins
- Rate limiting on API endpoints

## Inter-Service Communication

### HTTP Client Pattern
```typescript
// Axios-based service client with retry logic
const response = await axios.post(
  `${USER_SERVICE_URL}/validate`,
  { userId },
  {
    timeout: SERVICE_TIMEOUT,
    headers: { 'Content-Type': 'application/json' }
  }
);
```

### Service Request/Response Schema
```typescript
export const ServiceRequestSchema = z.object({
  serviceId: z.string(),
  action: z.string(),
  payload: z.any(),
  userId: z.string().optional(),
  requestId: z.string(),
  timestamp: z.string()
});
```

## Background Job Patterns

### BullMQ Queue Usage
```typescript
// Queue definition
export const rescheduleQueue = new Queue('reschedule', {
  connection: { host: 'redis', port: 6379 }
});

// Enqueue job
await rescheduleQueue.add('reschedule-plan', {
  studyPlanId: id,
  correlationId: req.correlationId,
  triggeredBy: 'manual'
});

// Worker definition
const worker = new Worker('reschedule', async (job) => {
  const { studyPlanId } = job.data;
  await schedulingEngine.reschedule(studyPlanId);
});
```

## Environment Configuration

### Required Variables
- Always provide `.env.example` files
- Document all environment variables
- Use sensible defaults where possible
- Validate required variables on startup

### Configuration Loading
```typescript
import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
};
```

## Docker Standards

### Dockerfile Pattern
- Multi-stage builds for optimization
- Node.js 20+ Alpine images
- Prisma generation in build step
- Health check scripts included
- Non-root user for security

### Docker Compose
- Service dependencies with health checks
- Named volumes for data persistence
- Bridge network for service communication
- Environment variable injection
- Restart policies: `unless-stopped`

## Code Style Conventions

### Naming Conventions
- **Files**: camelCase for utilities, PascalCase for classes
- **Classes**: PascalCase (e.g., `StudyPlanController`)
- **Functions**: camelCase (e.g., `generateStudyPlan`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MASKED_FIELDS`)
- **Interfaces**: PascalCase with descriptive names
- **Types**: PascalCase, often inferred from Zod schemas

### Import Organization
1. External dependencies (express, jwt, etc.)
2. Internal modules (services, utils, middleware)
3. Types and interfaces
4. Constants and configuration

### Comment Standards
- JSDoc comments for public APIs
- Inline comments for complex logic only
- Self-documenting code preferred over comments
- Section separators in schema files: `// ===== SECTION =====`

## Common Idioms

### Async Context Storage
```typescript
import { AsyncLocalStorage } from 'async_hooks';
export const contextStore = new AsyncLocalStorage<Context>();

// Middleware to initialize context
export const contextMiddleware = (req, res, next) => {
  contextStore.run({ correlationId: req.correlationId }, () => next());
};
```

### Correlation ID Pattern
```typescript
// Generate or extract correlation ID
export const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};
```

### Health Check Pattern
```typescript
// Standalone health check script
import axios from 'axios';
const PORT = process.env.PORT || 3001;
axios.get(`http://localhost:${PORT}/health`)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```
