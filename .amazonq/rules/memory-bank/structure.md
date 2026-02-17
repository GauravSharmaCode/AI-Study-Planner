# Project Structure

## Directory Organization

```
ai-study-planner/
├── apps/                          # Application layer
│   └── nginx-gateway/            # NGINX API Gateway (Port 8080)
│       ├── nginx.conf            # Gateway configuration
│       ├── Dockerfile            # Gateway container
│       └── README.md             # Gateway documentation
│
├── services/                      # Microservices layer
│   ├── user-service/             # User management service (Port 3001)
│   │   ├── src/
│   │   │   ├── controllers/      # Request handlers
│   │   │   ├── middleware/       # Express middleware (auth, validation)
│   │   │   ├── routes/           # API route definitions
│   │   │   ├── services/         # Business logic layer
│   │   │   ├── utils/            # Utility functions
│   │   │   └── index.ts          # Service entry point
│   │   ├── prisma/               # Database schema & migrations
│   │   ├── tests/                # Unit and integration tests
│   │   ├── Dockerfile            # Service container
│   │   └── package.json          # Service dependencies
│   │
│   └── ai-schedule-service/      # AI scheduling service (Port 3002)
│       ├── src/
│       │   ├── controllers/      # Plan & session controllers
│       │   ├── services/         # Scheduling engine & AI client
│       │   ├── queues/           # BullMQ queue definitions
│       │   ├── workers/          # Background reschedule workers
│       │   ├── middleware/       # Auth & validation middleware
│       │   ├── routes/           # API route definitions
│       │   ├── utils/            # Utility functions
│       │   └── index.ts          # Service entry point
│       ├── prisma/               # Database schema & migrations
│       ├── tests/                # Unit and integration tests
│       ├── Dockerfile            # Service container
│       └── package.json          # Service dependencies
│
├── infra/                         # Infrastructure configuration
│   ├── nginx.conf                # Load balancer configuration
│   ├── init-user-db.sql          # User DB initialization
│   └── init-schedule-db.sql      # Schedule DB initialization
│
├── scripts/                       # Development & testing scripts
│   ├── dev-helper.sh/bat         # Development utilities
│   ├── test-integration.js       # Integration test suite
│   ├── test-api.bat              # API testing script
│   └── test-structure.sh/bat     # Structure validation
│
├── logs/                          # Application logs
├── .github/workflows/            # CI/CD pipelines
├── docker-compose.yml            # Service orchestration
├── package.json                  # Workspace configuration
└── tsconfig.base.json            # Shared TypeScript config
```

## Core Components

### 1. NGINX Gateway (Port 8080)
**Purpose**: API Gateway and reverse proxy
- Routes requests to appropriate microservices
- Implements rate limiting with different zones
- Provides load balancing with health checks
- Handles CORS and security headers
- Exposes health endpoint on port 8090

### 2. User Service (Port 3001)
**Purpose**: User authentication and profile management
**Database**: PostgreSQL (Port 5432)
**Key Components**:
- Authentication controller (register, login, logout)
- User profile controller (CRUD operations)
- JWT middleware for token validation
- Bcrypt for password hashing
- Prisma ORM for database access

### 3. AI Schedule Service (Port 3002)
**Purpose**: AI-powered study schedule generation
**Database**: PostgreSQL (Port 5433)
**Cache/Queue**: Redis (Port 6379)
**Key Components**:
- Plan controller (generate, CRUD, analytics)
- Session controller (status updates, remarks)
- Scheduling engine (deterministic logic)
- AI client (Google Gemini integration)
- BullMQ workers (adaptive rescheduling)
- User validation via HTTP to User Service

### 4. Supporting Infrastructure
- **PostgreSQL Databases**: Separate databases for each service
- **Redis**: Caching and BullMQ job queue
- **Docker Network**: Bridge network for service communication

## Architectural Patterns

### Microservices Architecture
- **Domain Separation**: Each service owns its domain and database
- **Independent Deployment**: Services can be deployed independently
- **Service Communication**: HTTP for synchronous, Redis/BullMQ for async
- **API Gateway Pattern**: Single entry point through NGINX

### Layered Architecture (Per Service)
```
Routes → Controllers → Services → Database
         ↓
    Middleware (Auth, Validation)
```

### Database Per Service Pattern
- User Service: `user_service_db` (Port 5432)
- AI Schedule Service: `ai_schedule_db` (Port 5433)
- No direct database sharing between services

### Background Job Processing
- BullMQ workers for asynchronous reschedule operations
- Redis as job queue and cache
- Automatic workload redistribution on session status changes

## Service Relationships

```
Client → NGINX Gateway (8080)
           ↓
    ┌──────┴──────┐
    ↓             ↓
User Service  AI Schedule Service
    ↓             ↓
User DB       Schedule DB
              ↓
            Redis (Cache + Queue)
              ↓
         BullMQ Workers
```

### Inter-Service Communication
- **AI Schedule → User Service**: HTTP calls for user validation
- **Services → Redis**: Caching and job queue operations
- **NGINX → Services**: HTTP reverse proxy with health checks

## Configuration Management
- **Environment Variables**: Service-specific .env files
- **Docker Compose**: Centralized service orchestration
- **Shared Config**: Base TypeScript config for consistency
- **Workspace**: npm workspaces for monorepo management
