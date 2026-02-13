# AI Study Planner - Technology Stack

## Programming Languages & Versions
- **TypeScript 5.7.2**: Primary language for type-safe development
- **Node.js 20+**: Runtime environment with ES modules support
- **JavaScript**: Configuration files and legacy test components

## Core Technologies

### Backend Framework
- **Express.js**: RESTful API server framework
- **Prisma ORM**: Type-safe database client with schema management
- **Zod**: Runtime validation and TypeScript type inference

### Database & Caching
- **PostgreSQL 16**: Primary data storage with Alpine Linux containers
- **Redis 7**: Caching and session management
- **Database Isolation**: Separate databases per microservice

### AI Integration
- **Google Gemini AI**: AI-powered study plan generation
- **Model**: gemini-1.5-pro with configurable temperature and token limits

### Infrastructure
- **Docker & Docker Compose**: Containerization and orchestration
- **NGINX**: API gateway, reverse proxy, and load balancing
- **Alpine Linux**: Lightweight container base images

## Development Tools & Dependencies

### Build System
- **npm Workspaces**: Monorepo dependency management
- **TypeScript Compiler**: Type checking and compilation
- **ESLint 9.17.0**: Code linting with TypeScript support
- **Prettier 3.4.2**: Code formatting

### Testing Framework
- **Jest**: Unit and integration testing
- **Supertest**: HTTP endpoint testing
- **Test Environment**: Separate test database configurations

### Security & Authentication
- **JWT (jsonwebtoken)**: Token-based authentication
- **bcrypt**: Password hashing with configurable rounds
- **CORS**: Cross-origin request handling

### Logging & Monitoring
- **Winston**: Structured logging with multiple transports
- **Health Checks**: Container and service health monitoring
- **Log Aggregation**: Centralized logging directory

## Development Commands

### Workspace Management
```bash
npm install                    # Install all workspace dependencies
npm run build                  # Build all services
npm run dev                    # Start development servers
npm run test                   # Run all test suites
```

### Service-Specific Commands
```bash
npm run test:user             # Test user service only
npm run test:schedule         # Test AI schedule service only
npm run lint                  # Lint all services
npm run lint:fix              # Auto-fix linting issues
```

### Docker Operations
```bash
npm run docker:build         # Build all containers
npm run docker:up            # Start all services
npm run docker:down          # Stop all services
npm run docker:logs          # View service logs
npm run docker:health        # Check service health
```

### Database Management
```bash
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema changes
npx prisma migrate dev       # Create and apply migrations
```

## Environment Configuration

### Required Environment Variables
- `GOOGLE_GENAI_API_KEY`: Google Gemini AI API access
- `JWT_SECRET`: JWT token signing secret
- `DATABASE_URL`: PostgreSQL connection strings
- `REDIS_URL`: Redis connection configuration

### Service Ports
- **User Service**: 3001 (internal)
- **AI Schedule Service**: 3002 (internal)
- **NGINX Gateway**: 8080 (external), 8090 (admin)
- **PostgreSQL User DB**: 5432
- **PostgreSQL Schedule DB**: 5433
- **Redis**: 6379

## Performance & Scalability

### Optimization Features
- **Connection Pooling**: Prisma connection management
- **Caching Strategy**: Redis for session and data caching
- **Load Balancing**: NGINX upstream configuration
- **Health Monitoring**: Comprehensive service health checks

### Container Optimization
- **Multi-Stage Builds**: Separate build and runtime environments
- **Alpine Images**: Minimal container footprint
- **Volume Management**: Persistent data and log storage