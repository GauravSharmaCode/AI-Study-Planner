# Technology Stack

## Programming Languages
- **TypeScript 5.7.2**: Primary language for all services
- **JavaScript**: Build output and runtime
- **Node.js 20+**: Runtime environment (minimum version enforced)

## Core Frameworks & Libraries

### Backend Framework
- **Express.js 4.x**: Web framework for both services
- **ts-node**: TypeScript execution for development
- **ts-node-dev**: Development server with auto-reload

### Database & ORM
- **PostgreSQL 16**: Primary database (Alpine image)
  - User Service DB: Port 5432
  - Schedule Service DB: Port 5433
- **Prisma 6.4.1**: Type-safe ORM and migration tool
- **@prisma/client**: Database client generation

### Caching & Queue
- **Redis 7**: Cache and message broker (Alpine image)
- **ioredis 5.3.2**: Redis client for Node.js
- **BullMQ 5.1.0**: Background job processing

### AI Integration
- **@google/genai 1.0.0**: Google Gemini AI SDK
- **Model**: gemini-1.5-pro (configurable)

### Authentication & Security
- **jsonwebtoken 9.0.2**: JWT token generation/validation
- **bcryptjs 2.4.3**: Password hashing (12 rounds)
- **helmet**: Security headers middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit 7.1.5**: Rate limiting middleware

### Validation
- **zod 4.3.5**: Schema validation and type inference
- **express-validator 7.0.1**: Request validation middleware

### HTTP Client
- **axios 1.8.2**: HTTP client for inter-service communication

### Logging
- **winston 3.15.0**: Structured logging (AI Schedule Service)
- **morgan 1.10.0**: HTTP request logging
- **@gauravsharmacode/neat-logger 1.0.0**: Custom logger (User Service)

## Development Tools

### Build Tools
- **TypeScript Compiler**: Transpilation to JavaScript
- **npm workspaces**: Monorepo management
- **rimraf**: Cross-platform file cleanup

### Code Quality
- **ESLint 9.x**: Linting with TypeScript support
  - @typescript-eslint/eslint-plugin 8.55.0
  - @typescript-eslint/parser 8.55.0
- **Prettier 3.4.2**: Code formatting
- **globals**: ESLint global variables

### Testing
- **Jest 29.7.0**: Testing framework
- **ts-jest 29.4.6**: TypeScript preprocessor for Jest
- **supertest 6.3.4**: HTTP assertion library
- **@types/jest**: TypeScript definitions

### Containerization
- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration
- **NGINX**: API Gateway and reverse proxy

## Build System

### Workspace Scripts (Root)
```bash
npm run build          # Build all services
npm run dev            # Start all services in dev mode
npm run start          # Start all services in production
npm run test           # Run all tests
npm run lint           # Lint all services
npm run lint:fix       # Fix linting issues
npm run clean          # Clean build artifacts
npm run docker:build   # Build Docker images
npm run docker:up      # Start Docker containers
npm run docker:down    # Stop Docker containers
npm run docker:logs    # View container logs
npm run format         # Format code with Prettier
```

### Service-Specific Scripts
```bash
# User Service
npm run dev                    # Development mode
npm run build                  # Build TypeScript
npm run start                  # Production mode
npm run prisma:migrate         # Run migrations
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate:prod    # Deploy migrations
npm run test                   # Run tests
npm run lint                   # Lint code

# AI Schedule Service
npm run dev                    # Development mode
npm run build                  # Build TypeScript
npm run start                  # Production mode
npm run test                   # Run tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run lint                   # Lint code
npm run lint:fix               # Fix linting issues
```

### Docker Commands
```bash
# Build and start
docker-compose up --build

# Start specific services
docker-compose up user-service ai-schedule-service

# View logs
docker-compose logs -f user-service

# Execute commands
docker-compose exec user-service npx prisma migrate deploy

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

## Environment Configuration

### Required Environment Variables

#### User Service
- `PORT`: Service port (default: 3001)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)
- `REDIS_URL`: Redis connection string
- `CORS_ORIGIN`: Allowed CORS origin
- `LOG_LEVEL`: Logging level (info, debug, error)

#### AI Schedule Service
- `PORT`: Service port (default: 3002)
- `DATABASE_URL`: PostgreSQL connection string
- `USER_SERVICE_URL`: User service endpoint
- `GOOGLE_GENAI_API_KEY`: Google Gemini API key
- `AI_MODEL`: AI model name (default: gemini-1.5-pro)
- `AI_TEMPERATURE`: AI temperature (default: 0.7)
- `AI_MAX_TOKENS`: Max tokens (default: 2048)
- `JWT_SECRET`: JWT validation secret
- `REDIS_URL`: Redis connection string
- `CORS_ORIGIN`: Allowed CORS origin
- `LOG_LEVEL`: Logging level
- `SERVICE_TIMEOUT`: HTTP timeout (default: 10000ms)
- `SERVICE_RETRY_ATTEMPTS`: Retry attempts (default: 3)

## Version Requirements
- **Node.js**: >=20.0.0
- **npm**: >=8.0.0
- **Docker**: Latest stable
- **Docker Compose**: Latest stable

## Package Management
- **npm workspaces**: Monorepo dependency management
- **Private workspace**: Not published to npm registry
- **Shared dependencies**: Managed at root level
- **Service dependencies**: Isolated per service
