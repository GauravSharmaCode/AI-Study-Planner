# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Study Planner is a microservices architecture built with TypeScript, Express.js, Docker, PostgreSQL, and Redis. It generates AI-assisted study plans using Google Gemini and manages them through deterministic scheduling logic with adaptive rescheduling capabilities.

## Architecture

### Services

```
┌─────────────────┐    ┌─────────────────┐
│   NGINX Gateway │◄──►│   Port 8080    │
│   (apps/nginx)  │    │                 │
└────────┬────────┘    └─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐   ┌─▼───────────────┐
│ User  │   │ AI Schedule     │
│Svc:3001   │ Service:3002    │
│         │   │                 │
│- Auth   │   │- Plan generation│
│- JWT    │   │- BullMQ workers │
│- Prisma │   │- Rescheduling   │
└───┬─────┘   └─┬───────────────┘
    │           │
┌───▼───┐   ┌───▼────┐   ┌────────┐
│User DB│   │Schedule│   │ Redis  │
│:5432  │   │DB:5433 │   │:6379   │
└───────┘   └────────┘   └────────┘
```

- **User Service** (`services/user-service`): Authentication, JWT tokens, profile management. Uses `@gauravsharmacode/neat-logger`.
- **AI Schedule Service** (`services/ai-schedule-service`): Study plan generation with deterministic `schedulingEngine.ts`, BullMQ background workers for rescheduling, Google Gemini integration. Uses `winston` for logging.
- **NGINX Gateway** (`apps/nginx-gateway`): Reverse proxy, rate limiting, routes `/api/v1/*` to appropriate services.

### Service Communication

Services communicate via HTTP through the NGINX gateway (port 8080). The AI Schedule Service validates users by making HTTP calls to the User Service (configured via `USER_SERVICE_URL`). Never import code directly across service boundaries.

### Key Architectural Patterns

1. **Deterministic Scheduling Engine** (`services/ai-schedule-service/src/services/schedulingEngine.ts`): Pure functions that convert AI topic estimates into reproducible daily schedules. No side effects - fully testable.
2. **BullMQ Workers**: Background job processing for adaptive rescheduling when study sessions are skipped.
3. **Zod-first Validation**: All inbound data validated at service boundaries. Infer TypeScript types from Zod schemas.
4. **Structured Logging**: Correlation IDs flow across requests; never use `console.*` in production code.
5. **Prisma ORM**: Each service has its own database schema and Prisma client generation.

## Common Commands

### Prerequisites

- **Node.js**: 20+ (package.json requires `node >=20.0.0`)
- **Docker** and **Docker Compose**
- **Google Gemini AI API Key**

### Installation & Development

```bash
# Install all dependencies (root + workspaces)
npm install

# Build all services (runs Prisma generate + tsc)
npm run build

# Run both services in dev mode concurrently
npm run dev

# Start all services
npm run start
```

### Service-Specific Development

```bash
# User Service
cd services/user-service
npm run dev        # ts-node-dev with watch
npm run build      # prisma:generate + tsc
npm run start      # node dist/index.js
npm run test       # jest --passWithNoTests
npm run test:watch # jest --watch --passWithNoTests
npm run test:coverage # jest --coverage --passWithNoTests

# AI Schedule Service
cd services/ai-schedule-service
npm run dev        # ts-node src/index.ts
npm run build      # prisma generate + tsc
npm run start      # node dist/index.js
npm run test       # jest
npm run test:watch # jest --watch
npm run test:coverage # jest --coverage
```

### Running a Single Test

```bash
# By file path (from service directory)
npx jest src/path/to/test.test.ts

# By test name pattern
npx jest -t "should create a user"

# Using npm scripts
cd services/user-service && npm run test -- -t "create"
```

### Testing

```bash
# Run all tests across workspaces
npm test

# Run tests for specific service
npm run test:user
npm run test:schedule

# Run single test file (inside service directory)
cd services/user-service && npx jest src/controllers/user.test.ts
cd services/ai-schedule-service && npx jest src/services/schedulingEngine.test.ts

# Run test by name pattern
npx jest -t "should create a user"

# Watch mode
cd services/user-service && npm run test:watch
cd services/ai-schedule-service && npm run test:watch

# Coverage
cd services/user-service && npm run test:coverage
cd services/ai-schedule-service && npm run test:coverage
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Lint specific service
npm run lint:user
npm run lint:schedule

# Fix linting issues
npm run lint:fix

# Format with Prettier (no config file, uses defaults)
npm run format
```

### Docker

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Start only databases for local dev
docker-compose up user-db schedule-db redis -d

# View logs
docker-compose logs -f user-service
docker-compose logs -f ai-schedule-service

# Execute commands in containers
docker-compose exec user-service npx prisma migrate deploy
docker-compose exec ai-schedule-service npx prisma migrate deploy

# Stop everything
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

### Database Operations

```bash
# User Service
cd services/user-service
npx prisma migrate dev      # Development migrations
npx prisma migrate deploy   # Production migrations
npx prisma generate         # Generate client
npx prisma studio           # Open Prisma Studio

# AI Schedule Service
cd services/ai-schedule-service
npx prisma migrate dev
npx prisma migrate deploy
npx prisma generate
npx prisma studio
```

## Key Conventions

### TypeScript Configuration

- All services use `strict: true`. Type errors are blocking.
- `rootDir: ./src`, `outDir: ./dist`. Never import from `dist/`.
- Test files (`*.test.ts`, `*.spec.ts`) excluded from TS build; Jest transpiles with ts-jest.
- CommonJS output with `esModuleInterop: true`.

### Code Style

- Files: `kebab-case.ts`
- Variables/functions: `camelCase`
- Types/interfaces/classes: `PascalCase`
- Constants/env: `UPPER_SNAKE_CASE`
- Group imports: Node built-ins, external libs, internal modules (separate groups with blank line)

### Error Handling & Logging

- Use typed error classes (e.g., `HttpError` with `status`, `code`, `message`).
- Centralized Express error handling middleware.
- AI Schedule Service: Use `createLogger(serviceName)` from `utils/logger.ts`.
- User Service: Use `logger` from `utils/logger-wrapper.ts`.
- ESLint warns on `console.*` - prefer structured loggers.

### Environment Variables

Required for local development (see `.env.example` files in each service):
- `JWT_SECRET`: Shared across services for token validation
- `GOOGLE_GENAI_API_KEY` / `GEMINI_API_KEY`: For AI scheduling
- `DATABASE_URL`: Each service has its own PostgreSQL database
- `REDIS_URL`: For BullMQ queues (AI Schedule Service)
- `USER_SERVICE_URL`: AI Schedule Service uses this to validate users

### Git Workflow

- **Default branch**: `dev` (not `main`).
- **PR target**: Always create PRs to `dev`.
- **Branch naming**: `feature/`, `fix/`, `refactor/` prefixes.
- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Never commit directly to `dev` or `main`.

### SpecKit Workflow

The repository uses a spec-driven development workflow defined in `.agent/workflows/speckit.*.md`. These files are the canonical source of truth for:
- Phase ordering
- Validation gates
- Cross-artifact checks

Tool-specific adapters in `.qwen/commands/`, `.opencode/command/`, etc. wrap these canonical definitions. When working with specifications, reference the `.agent/workflows/` files as the authoritative source.

## Testing Notes

- Jest + ts-jest configuration in each service.
- Tests located in `tests/` directories (per `jest.config.json`).
- Tests should mock external services (DB, HTTP, AI); do not depend on real infrastructure in unit tests.
- User Service: `--passWithNoTests` flag enabled.
- AI Schedule Service: `schedulingEngine.ts` is pure functions - easily testable without mocks.

## Common Pitfalls

1. **Prisma Client**: Must run `prisma generate` before TypeScript build. Service `build` scripts handle this automatically.
2. **Cross-service imports**: Never import from another service's `src/`. Use HTTP APIs.
3. **Lint in ai-schedule-service**: Currently has ESLint 9.x compatibility issues. Can run `npx eslint .` directly using local `.eslintrc.js` if needed.
4. **Docker health checks**: Services depend on databases being healthy. First startup may take time for migrations.
5. **Redis dependency**: AI Schedule Service workers fail gracefully if Redis unavailable, but rescheduling functionality will be disabled.
