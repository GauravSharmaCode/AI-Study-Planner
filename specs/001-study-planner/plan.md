# Implementation Plan - Deterministic Study Planner

## Architecture & Stack

- **API Engine**: Node.js with Express
- **Database**: PostgreSQL per service (User Service, AI Schedule Service)
- **Data Layer**: Prisma ORM
- **Async Queue**: Redis with BullMQ
- **Routing**: NGINX API Gateway
- **Containerization**: Docker & Docker Compose
- **Validation**: Zod (all request envelopes and env variables)
- **Logging**: Winston (Structured logging with correlation IDs)

## Constitution Check

- [x] Schema-First Design (Zod for all endpoints & envs)
- [x] Service Decoupling (NGINX routing)
- [x] Structured Logging (Winston configured)
- [x] Typed Error Handling (AppError & middleware)
- [x] Test Independence (TDD test-first methodology ordered in tasks)
- [x] Containerization (Docker-first deployment)

## Phase 1: Setup & Data Layer Migration

**Goal**: Transition to structured `Topic` and `Session` models, harden infrastructure.

1. **Docker & Infrastructure**: Setup Dockerfiles, `docker-compose.yml`, health checks, Winston logging, and centralized error handling per the Constitution.
2. **Update User Service Schema**: Add `UserRole` enum (STUDENT, ADMIN) and validation logic. Run `prisma migrate dev`.
3. **Refactor AI Schedule Schema**: Implement the new `Topic`, `StudyPlan`, `StudySession` models.
4. **Seed Data**: Create seed scripts for dev environment (5 mock users in User DB, 1 plan in Schedule DB).

## Phase 2: Core Scheduling Engine (TDD)

**Goal**: Implement the deterministic algorithm in `services/ai-schedule-service/src/services/schedulingEngine.ts`.

1. **Write Unit Tests First**:
   - Verify deterministic output.
   - Verify constraint handling (max 90m sessions).
   - Verify error throwing on "Impossible Plan" (Overload).
2. **Implement `generateSchedule()`**:
   - Input: `Topic[]`, `startDate`, `examDate`, `dailyHours`.
   - Logic: Time slot allocation, conflict avoidance.
3. **Implement Spaced Repetition**:
   - Add revisions at +3, +7, +14 days (25% of original duration).
   - Logic: Prioritize revisions in daily slots.

## Phase 3: API & Orchestration

**Goal**: Expose endpoints, integrate AI heuristics, and secure API boundaries.

1. **Security & Validation**:
   - Add JWT and RBAC (STUDENT, ADMIN) middlewares.
   - Comprehensive Zod validation on ALL request inputs (params, query, body) + ENV vars.
2. **`POST /plans`**:
   - Call Gemini AI API for `Topic` metadata (latency fallback to mock 60m estimation).
   - Transactional save (Plan + Topics + Sessions) with UTC Timezone transformation middleware mapping boundary.
3. **`GET /plans/:id` & `GET /sessions`**:
   - Fetch plans and filter sessions by date range querying.

## Phase 4: Async Rescheduling System

**Goal**: Adaptive self-correction without extending exam dates.

1. **Setup BullMQ**:
   - Configure Redis connection. Implement job deduplication (idempotent guard using `jobId = planId`).
2. **`PATCH /sessions/:id/status`**:
   - Update session status (SKIPPED/PARTIAL/COMPLETED).
   - Push job to `rescheduleQueue` if status is SKIPPED or PARTIAL.
3. **Implement Worker**:
   - Recalculate schedule from _Tomorrow_ onwards.
   - **Critical**: `DELETE` future sessions, `INSERT` new sessions (Atomic Transaction).
4. **Dead Letter Queue**:
   - Configure retry + DLQ. Add DLQ depth monitoring/alerting logic.

## Phase 5: Reliability & Analytics

**Goal**: Production hardening.

1. **AI Circuit Breaker & Retry**:
   - Wrap Gemini calls with `opossum` circuit breaker and explicit exponential backoff retry logic.
2. **Analytics Endpoint**:
   - `GET /plans/:id/analytics`. Calculates Coverage, Risk Score, and Velocity (completed/days).
3. **Load Testing**:
   - Script 100 concurrent plan generations against 10k users support to meet performance thresholds.

## Migration Strategy (from MVP)

**Decision**: Archive all existing JSON plans. Require users to **Create New Plan**.
