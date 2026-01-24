# AI Study Planner - Project Structure

## Directory Organization

### Root Level Structure
```
ai-study-planner/
├── services/           # Microservices (user-service, ai-schedule-service)
├── apps/              # Applications (nginx-gateway)
├── infra/             # Infrastructure scripts and configurations
├── docs/              # Documentation and planning files
├── scripts/           # Development and testing utilities
├── logs/              # Centralized logging directory
└── package.json       # Workspace configuration
```

### Services Architecture
**Monorepo with Independent Services**
- `services/user-service/` - User management and authentication (Port 3001)
- `services/ai-schedule-service/` - AI-powered study planning (Port 3002)
- `apps/nginx-gateway/` - API gateway and load balancer (Port 8080)

### Service Internal Structure
Each service follows consistent organization:
```
service-name/
├── src/
│   ├── config/        # Database and environment configuration
│   ├── controllers/   # HTTP request handlers
│   ├── middleware/    # Authentication, validation, error handling
│   ├── models/        # Data models and database interactions
│   ├── routes/        # API route definitions
│   ├── schemas/       # Zod validation schemas
│   ├── services/      # Business logic layer
│   └── utils/         # Shared utilities (logging, clients)
├── tests/
│   ├── unit/          # Unit tests
│   └── integration/   # Integration tests
├── prisma/            # Database schema and migrations
└── package.json       # Service-specific dependencies
```

## Core Components & Relationships

### Data Layer
- **PostgreSQL Databases**: Separate databases per service for data isolation
  - `user_service_db` (Port 5432) - User data and authentication
  - `ai_schedule_db` (Port 5433) - Study plans and sessions
- **Redis Cache** (Port 6379) - Session management and caching
- **Prisma ORM**: Type-safe database access with schema-first approach

### Service Communication
- **HTTP APIs**: RESTful communication between services
- **Service Discovery**: Direct container-to-container communication via Docker network
- **Shared Contracts**: Zod schemas ensure type safety across service boundaries

### Infrastructure Components
- **NGINX Gateway**: Reverse proxy, load balancing, and API routing
- **Docker Network**: `ai-study-network` for secure inter-service communication
- **Health Checks**: Comprehensive health monitoring for all services
- **Logging**: Centralized Winston-based logging with file and console outputs

## Architectural Patterns

### Microservices Design
- **Domain Separation**: Clear boundaries between user management and AI scheduling
- **Database Per Service**: Independent data stores prevent coupling
- **API Gateway Pattern**: Single entry point for external clients

### Schema-First Development
- **Zod Validation**: Runtime validation with TypeScript type inference
- **Contract Enforcement**: Shared schemas ensure API consistency
- **Type Safety**: Compile-time and runtime type checking

### Container Architecture
- **Multi-Stage Builds**: Optimized Docker images with build and runtime stages
- **Health Monitoring**: Container health checks for reliable deployments
- **Volume Management**: Persistent data storage and log aggregation

### Development Patterns
- **Workspace Management**: npm workspaces for monorepo dependency handling
- **Environment Configuration**: Docker Compose for local development
- **Testing Strategy**: Separate unit and integration test suites per service