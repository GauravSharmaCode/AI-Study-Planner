# AI Study Planner - Development Guidelines

## Code Quality Standards

### TypeScript Configuration
- **Strict Type Safety**: All services use strict TypeScript configuration with explicit type annotations
- **Interface-First Design**: Define interfaces before implementation, especially for API contracts and data models
- **Type Inference**: Leverage TypeScript's type inference while maintaining explicit types for public APIs
- **Generic Constraints**: Use generic types with proper constraints for reusable components

### Code Formatting & Structure
- **Consistent Indentation**: Use 2-space indentation throughout the codebase
- **Line Length**: Maintain reasonable line lengths with proper line breaks for readability
- **Import Organization**: Group imports by type (external libraries, internal modules, types)
- **File Naming**: Use camelCase for files, PascalCase for classes, kebab-case for directories

### Documentation Standards
- **JSDoc Comments**: All public methods must have comprehensive JSDoc documentation
- **Parameter Documentation**: Document all parameters with types and descriptions
- **Return Value Documentation**: Clearly document return types and possible values
- **Error Documentation**: Document thrown errors and their conditions

## Architectural Patterns

### Service Layer Architecture
- **Single Responsibility**: Each service class handles one domain (UserModel, StudyPlanService)
- **Dependency Injection**: Constructor-based dependency injection for database clients and loggers
- **Error Boundaries**: Consistent error handling with try-catch blocks and proper error propagation
- **Resource Management**: Proper cleanup methods (disconnect, close) for external resources

### Database Interaction Patterns
- **Prisma ORM Integration**: Use Prisma client for all database operations
- **Select Field Control**: Define explicit select objects for data security (safeUserSelect, userSelectWithPassword)
- **Transaction Management**: Use Prisma transactions for multi-step operations
- **Soft Delete Pattern**: Implement soft deletes with deletedAt timestamps and includeDeleted flags

### API Controller Patterns
- **Request Validation**: Validate all incoming requests using express-validator middleware
- **Response Standardization**: Consistent response formats with proper HTTP status codes
- **Error Handling**: Centralized error handling with AppError class and middleware
- **Parameter Type Casting**: Explicit casting of route parameters (String(req.params.id))

## Testing Standards

### Test Organization
- **Comprehensive Mocking**: Mock all external dependencies (Prisma, AI clients, loggers)
- **Test Isolation**: Each test should be independent with proper setup and teardown
- **Mock Strategy**: Use Jest mocks with consistent mock object structures
- **Test Coverage**: Cover happy paths, error cases, and edge conditions

### Mock Implementation Patterns
```typescript
// Service mocking pattern
const mockStudyPlanService = {
  createPlan: jest.fn(),
  getPlanById: jest.fn(),
  updateSessionStatus: jest.fn(),
};

// Database mocking pattern
const mockPrisma = {
  studyPlan: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};
```

### Test Structure
- **Describe Blocks**: Group tests by functionality (controller methods, service operations)
- **Setup Methods**: Use beforeEach for consistent test environment setup
- **Assertion Patterns**: Verify both successful operations and error conditions
- **Mock Verification**: Assert that mocked methods are called with correct parameters

## Error Handling Patterns

### Service Layer Error Handling
- **Try-Catch Wrapping**: Wrap all async operations in try-catch blocks
- **Error Logging**: Log errors with contextual information using structured logging
- **Error Transformation**: Convert database/external errors to application-specific errors
- **Error Propagation**: Re-throw errors with meaningful messages for upper layers

### Validation Patterns
- **Input Validation**: Validate all inputs at service boundaries
- **Type Guards**: Use type checking for runtime validation
- **Business Rule Validation**: Implement domain-specific validation rules
- **Error Message Consistency**: Provide clear, actionable error messages

## Logging Standards

### Structured Logging
- **Winston Integration**: Use Winston logger with structured metadata
- **Log Levels**: Appropriate use of debug, info, warn, error levels
- **Contextual Metadata**: Include relevant context (userId, planId, operation) in log entries
- **Function Identification**: Include function names in log metadata for traceability

### Logging Patterns
```typescript
const func = "UserModel.create";
logWithMeta("Creating user in database", {
  func,
  level: "info",
  extra: { email: userData.email },
});
```

## Security Practices

### Data Protection
- **Password Exclusion**: Never include passwords in API responses or logs
- **Selective Field Exposure**: Use explicit select objects to control data exposure
- **Input Sanitization**: Sanitize and validate all user inputs
- **Soft Delete Implementation**: Use soft deletes to maintain data integrity

### Authentication Patterns
- **JWT Integration**: Consistent JWT token handling across services
- **Password Hashing**: Use bcrypt with configurable rounds for password security
- **Session Management**: Implement proper session lifecycle management
- **Role-Based Access**: Support role-based authorization patterns

## Performance Optimization

### Database Optimization
- **Connection Pooling**: Leverage Prisma's built-in connection pooling
- **Query Optimization**: Use appropriate select fields and include relationships
- **Pagination Support**: Implement consistent pagination patterns
- **Index Strategy**: Design database indexes for common query patterns

### Caching Strategies
- **Redis Integration**: Use Redis for session and data caching
- **Cache Invalidation**: Implement proper cache invalidation strategies
- **Performance Monitoring**: Log query performance and identify bottlenecks

## AI Integration Patterns

### Retry Logic Implementation
- **Exponential Backoff**: Implement retry logic with exponential backoff for AI API calls
- **Error Recovery**: Graceful degradation when AI services are unavailable
- **Response Validation**: Validate AI responses before processing
- **Structured Output**: Use response schemas for consistent AI output format

### Prompt Engineering
- **Template-Based Prompts**: Use consistent prompt templates for AI interactions
- **JSON Schema Validation**: Define and validate expected AI response formats
- **Fallback Mechanisms**: Implement fallback strategies when AI generation fails