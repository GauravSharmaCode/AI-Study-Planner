# Feature: Deterministic Study Planner & Scheduling Engine

## Phase 1: Setup, Infrastructure & Constitution Alignment

**Goal**: Initialize project structure, enforce constitution principles, update schemas, and seed data.

- [ ] T001 [P] Create Dockerfiles for User Service and AI Schedule Service with multi-stage builds and non-root users.
- [ ] T002 [P] Create `docker-compose.yml` for services, PostgreSQL databases, and Redis with health checks.
- [ ] T003 [P] Configure `winston` structured logger and correlation ID middleware in `services/ai-schedule-service`.
- [ ] T004 [P] Create `AppError` class hierarchy and centralized Express error handler in both services.
- [ ] T005 [P] Implement environment variable validation with Zod at startup.
- [ ] T006 [P] Update User Service schema in `services/user-service/prisma/schema.prisma` to include `UserRole` enum (STUDENT, ADMIN) and create migration.
- [ ] T007 [P] Implement `UserRole` type definition in `services/user-service/src/models/user.ts`.
- [ ] T008 [P] Update AI Schedule Service schema in `services/ai-schedule-service/prisma/schema.prisma` with `StudyPlan`, `Topic`, `StudySession` models.
- [ ] T009 [US1] Create seed script to populate 5 mock users in User Service DB.
- [ ] T010 [US1] Create seed script to populate 1 complex study plan in AI Schedule Service DB.

## Phase 2: Core Scheduling Engine (TDD)

**Goal**: Implement the deterministic algorithm, writing tests _before_ logic per the Constitution.

- [ ] T011 [US1] Create unit tests for `generateSchedule` in `schedulingEngine.test.ts` to verify deterministic output.
- [ ] T012 [US1] Add test case for "Impossible Plan" (Overload).
- [ ] T013 [US1] Add test case for max session duration (90m).
- [ ] T014 [US1] Create `SchedulingEngine` class in `schedulingEngine.ts`.
- [ ] T015 [US1] Implement `calculateDailySlots` to determine available time blocks.
- [ ] T016 [US1] Implement `distributeTopics` to allocate topics to slots.
- [ ] T017 [US1] Implement `addRevisionSessions` (+3, +7, +14 days @ 25% duration).

## Phase 3: API & Orchestration

**Goal**: Expose endpoints, integrate AI heuristics, and secure API boundaries.

- [ ] T018 [P] Implement JWT authentication and RBAC (STUDENT, ADMIN) middleware.
- [ ] T019 [US1] Create Zod schemas for all request envelopes (body, query, params) across all endpoints.
- [ ] T020 [US1] Add timezone handling middleware to handle UTC conversions at the API boundary.
- [ ] T021 [US1] Implement `PlanController.create` with comprehensive Zod validation.
- [ ] T022 [US1] Create `AIService` wrapper to call real Gemini API with mock fallback on failure.
- [ ] T023 [US1] Implement transactional save logic (Plan + Topics + Sessions) in `plan.service.ts`.
- [ ] T024 [P] [US1] Register `POST /plans` route.
- [ ] T025 [US4] Implement `PlanController.getOne` with aggregation.
- [ ] T026 [P] [US4] Register `GET /plans/:id` route.
- [ ] T027 [US2] Implement `SessionController.list` with Zod-validated date range querying.
- [ ] T028 [P] [US2] Register `GET /sessions` route.

## Phase 4: Async Rescheduling System

**Goal**: Adaptive self-correction without extending exam dates.

- [ ] T029 [P] [US3] Configure Redis connection and BullMQ `rescheduleQueue`.
- [ ] T030 [US3] Implement idempotent job deduplication logic in queue manager (`jobId = planId`).
- [ ] T031 [US2] Implement `SessionController.updateStatus` with Zod param validation.
- [ ] T032 [US3] Trigger `rescheduleQueue` job on status change (SKIPPED or PARTIAL) in `session.service.ts`.
- [ ] T033 [US3] Implement `RescheduleWorker` to fetch plan and remaining topics.
- [ ] T034 [US3] Implement `recalculateSchedule` logic from tomorrow onwards.
- [ ] T035 [US3] Implement atomic transaction (DELETE future sessions + INSERT new sessions).
- [ ] T036 [US3] Configure Dead Letter Queue (DLQ), retry policy, and DLQ depth monitoring/alerting logic.

## Phase 5: Reliability & Analytics

**Goal**: Production hardening and insights.

- [ ] T037 [US1] Add `opossum` circuit breaker and explicit exponential backoff retry logic to `AIService`.
- [ ] T038 [US4] Implement `PlanController.getAnalytics`.
- [ ] T039 [US4] Calculate Coverage %, Risk Score, and Velocity (Sessions completed / days elapsed).
- [ ] T040 [P] [US4] Register `GET /plans/:id/analytics` route.
- [ ] T041 [P] Create load test script for 100 concurrent plan generations targeting 10k users support.
