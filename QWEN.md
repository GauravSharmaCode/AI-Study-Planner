# AI Study Planner - Project Context

## Project Overview

**AI Study Planner** is a microservices-based application that generates personalized AI-powered study schedules. Built with TypeScript, Express.js, Prisma ORM, PostgreSQL, and Google Gemini AI.

### Architecture

| Service | Port | Purpose |
|---------|------|---------|
| **User Service** | 3001 | User management, authentication, JWT-based auth |
| **AI Schedule Service** | 3002 | AI-powered study plan generation, session management |
| **NGINX Gateway** | 8080 | API gateway, reverse proxy, load balancer |
| **PostgreSQL (User)** | 5432 | Dedicated database for user service |
| **PostgreSQL (Schedule)** | 5433 | Dedicated database for schedule service |
| **Redis** | 6379 | Caching, session management, BullMQ queues |

### Key Design Principles

- **Schema-First Design**: Zod schemas for runtime validation; TypeScript types inferred from schemas
- **Service Decoupling**: Each service maintains its own copy of shared contracts (`src/schemas/index.ts`)
- **Inter-Service Communication**: HTTP via NGINX gateway (no direct service imports)
- **Containerization**: Full Docker support for one-command deployment

---

## Building and Running

### Prerequisites

- Node.js 18+ / npm 8+
- Docker and Docker Compose
- Google Gemini AI API Key

### Environment Setup

1. Create `.env` in root (copy from `.env.example`):
   ```bash
   GOOGLE_GENAI_API_KEY=your_key
   JWT_SECRET=your_secret
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Commands

#### Root Level (Monorepo)

```bash
npm run build              # Build all workspaces (includes prisma generate)
npm run dev                # Run both services concurrently
npm run start              # Start all services
npm run test               # Test all workspaces
npm run test:user          # Test user-service only
npm run test:schedule      # Test ai-schedule-service only
npm run lint               # Lint all workspaces
npm run lint:fix           # Lint + fix all workspaces
npm run format             # Prettier formatting
npm run clean              # Clean dist folders
```

#### Docker

```bash
docker-compose up -d --build    # Build and start all services
docker-compose down             # Stop all services
docker-compose logs -f          # Follow logs
docker-compose logs -f user-service
docker-compose logs -f ai-schedule-service
```

#### Service-Level

```bash
# User Service (services/user-service)
npm run build          # prisma:generate + tsc
npm run dev            # ts-node-dev (watch mode)
npm run start          # node dist/index.js
npm run test           # jest --passWithNoTests
npm run prisma:migrate # Run Prisma migrations

# AI Schedule Service (services/ai-schedule-service)
npm run build          # prisma generate + tsc
npm run dev            # ts-node src/index.ts
npm run start          # node dist/index.js
npm run test           # jest
```

#### Running Single Tests

```bash
# From service directory
npx jest src/path/to/test.test.ts
npx jest -t "should create user"
npm run test -- -t "create"
```

---

## Development Conventions

### TypeScript

- `strict: true` - All strict type-checking options enabled
- `noUncheckedIndexedAccess: true` - Indexed access is unchecked by default
- `exactOptionalPropertyTypes: true` - Optional properties must not be `undefined`
- Prefer `unknown` over `any`
- Do NOT import from `dist/` directories

### File & Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Directories | `kebab-case` | `user-controller.ts`, `auth-routes/` |
| Variables/Functions | `camelCase` | `getUserById`, `const userId` |
| Types/Interfaces/Classes | `PascalCase` | `UserDto`, `ApiError` |
| Constants/Env Variables | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `PORT` |
| DTOs | Suffix with `Dto` | `CreateUserDto`, `LoginResponseDto` |

### Import Organization

Group imports in this order:
1. Node.js built-ins (`http`, `path`)
2. External libraries (`express`, `axios`)
3. Internal modules (`./config`, `./routes`)

```typescript
import express from "express";
import axios from "axios";
import config from "./config";
import { userService } from "./services/userService";
```

### Formatting (Prettier)

- Semicolons: **on**
- Single quotes
- 2-space indent
- 120-char line limit (soft)
- Trailing commas where valid

### Runtime Validation (Zod-First)

All inbound data must be validated with Zod:

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type CreateUserDto = z.infer<typeof createUserSchema>;
```

### Error Handling

- Use structured loggers (`winston`, `@gauravsharmacode/neat-logger`) — **never `console.*`**
- Create typed error classes (`HttpError` with status, code, message)
- Centralize Express error handling in middleware
- Wrap external calls (DB, AI, HTTP) with try/catch
- Never leak secrets or stack traces in production logs

```typescript
class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
```

### Logging

```typescript
// User Service (neat-logger)
import { logWithMeta } from "@gauravsharmacode/neat-logger";
logWithMeta("User created", { func: "createUser", level: "info", extra: { userId } });

// AI Schedule Service (winston)
import { createLogger } from "./utils/logger";
const logger = createLogger("study-plan-service");
logger.info("Plan generated", { planId, userId });
```

### API Contracts

- Services communicate via HTTP through NGINX gateway (`http://localhost:8080`)
- Keep Zod schemas versioned per service in `src/schemas/`
- Do NOT import code across services

### Environment Variables

Key variables (validate at startup with Zod):

| Variable | Service | Description |
|----------|---------|-------------|
| `GOOGLE_GENAI_API_KEY` | ai-schedule-service | Google Gemini AI API key |
| `JWT_SECRET` | All | JWT signing secret |
| `DATABASE_URL` | Each service | PostgreSQL connection string |
| `REDIS_URL` | All | Redis connection string |
| `USER_SERVICE_URL` | ai-schedule-service | Internal user service URL |

### Testing Practices

- Jest for unit/integration tests
- Use `supertest` for HTTP endpoint testing
- Mock external dependencies (DB, AI, Redis)
- Test names: descriptive, e.g., `"should create user with valid email"`

### Git Workflow

- Default branch: `dev` (never commit directly)
- Branch prefixes: `feature/`, `fix/`, `refactor/`, `chore/`
- PR target: always `dev`
- Commit messages: Conventional Commits
  ```
  feat: add user profile endpoint
  fix: resolve JWT expiration bug
  chore: update dependencies
  docs: update README with docker commands
  ```

---

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| Forgetting `prisma generate` | Run `npm run build` (includes prisma:generate) |
| Using `console.log` | Use `logWithMeta` or `logger` instead |
| Importing across services | Use HTTP calls via NGINX gateway |
| Tests failing due to missing env | Mock environment variables in tests |
| Database connection errors | Ensure Docker containers are healthy before starting services |

---

## Project Structure

```
AI-Study-Planner/
├── services/
│   ├── user-service/          # Auth & user management
│   │   ├── src/
│   │   │   ├── config/        # DB, app config
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── middleware/    # Auth, error handling
│   │   │   ├── routes/        # Express routes
│   │   │   ├── schemas/       # Zod schemas
│   │   │   ├── services/      # Business logic
│   │   │   └── prisma/        # Prisma schema & migrations
│   │   └── tests/
│   │
│   └── ai-schedule-service/   # AI study planning
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── schemas/
│       │   ├── services/      # AI integration logic
│       │   ├── queues/        # BullMQ job queues
│       │   ├── workers/       # Background job processors
│       │   └── prisma/
│       └── tests/
│
├── apps/
│   └── nginx-gateway/         # NGINX reverse proxy config
│
├── infra/                     # Infrastructure configs
│   ├── init-user-db.sql
│   └── init-schedule-db.sql
│
├── scripts/                   # Utility scripts
├── docs/                      # Documentation
├── logs/                      # Application logs (git-ignored)
│
├── docker-compose.yml
├── package.json               # Root workspace config
├── tsconfig.base.json         # Shared TypeScript config
└── .env.example
```

---

## API Endpoints Summary

### User Service (`/api/v1/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/users/:id` | Get user profile |
| PUT | `/users/:id` | Update user profile |

### AI Schedule Service (`/api/v1/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/plans` | Create study plan |
| GET | `/plans/:id` | Get study plan |
| GET | `/plans/:id/sessions` | Get sessions for plan |
| PUT | `/sessions/:id` | Update session status |

---

## Debugging Tips

1. **Check service health**: `curl http://localhost:8080/health`
2. **View logs**: `docker-compose logs -f <service-name>`
3. **Database access**: Connect to `localhost:5432` (user) or `localhost:5433` (schedule)
4. **Redis CLI**: `docker exec -it ai-study-planner-redis redis-cli`
5. **Prisma Studio**: `npx prisma studio` (from service directory)
