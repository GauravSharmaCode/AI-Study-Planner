# Feature: Deterministic Study Planner & Scheduling Engine

## Phase 1: Setup & Data Layer Migration
**Goal**: Initialize project structure, update schemas, and seed data.

- [ ] T001 [P] Update User Service schema in `services/user-service/prisma/schema.prisma` to include `UserRole` enum.
- [ ] T002 [P] Create migration for User Service changes in `services/user-service/prisma/migrations/`.
- [ ] T003 [P] Implement `UserRole` type definition in `services/user-service/src/models/user.ts` (if manual types exist).
- [ ] T004 [P] Update AI Schedule Service schema in `services/ai-schedule-service/prisma/schema.prisma` with `StudyPlan`, `Topic`, `StudySession` models and Enums.
- [ ] T005 [P] Create migration for AI Schedule Service changes in `services/ai-schedule-service/prisma/migrations/`.
- [ ] T006 [US1] Create seed script in `services/ai-schedule-service/prisma/seed.ts` to populate 5 mock users and 1 complex study plan.
- [ ] T007 [US1] Run seed script to verify data integrity in local environment.

## Phase 2: Core Scheduling Engine (The "Brain")
**Goal**: Implement the deterministic algorithm for schedule generation.

- [ ] T008 [US1] Create `SchedulingEngine` class in `services/ai-schedule-service/src/services/schedulingEngine.ts`.
- [ ] T009 [US1] Implement `calculateDailySlots` method in `services/ai-schedule-service/src/services/schedulingEngine.ts` to determine available time blocks.
- [ ] T010 [US1] Implement `distributeTopics` method in `services/ai-schedule-service/src/services/schedulingEngine.ts` to allocate topics to slots.
- [ ] T011 [US1] Implement `addRevisionSessions` method in `services/ai-schedule-service/src/services/schedulingEngine.ts` for +3, +7, +14 days spacing.
- [ ] T012 [US1] Create unit tests for `generateSchedule` in `services/ai-schedule-service/src/services/schedulingEngine.test.ts` to verify deterministic output.
- [ ] T013 [US1] Add test case for "Impossible Plan" (Overload) in `services/ai-schedule-service/src/services/schedulingEngine.test.ts`.
- [ ] T014 [US1] Add test case for max session duration (90m) in `services/ai-schedule-service/src/services/schedulingEngine.test.ts`.

## Phase 3: API & Orchestration
**Goal**: Expose endpoints and integrate AI heuristics.

- [ ] T015 [US1] Create Zod schema for `CreatePlanDto` in `services/ai-schedule-service/src/controllers/plan.dto.ts`.
- [ ] T016 [US1] Implement `PlanController.create` in `services/ai-schedule-service/src/controllers/plan.controller.ts`.
- [ ] T017 [US1] Create `AIService` wrapper in `services/ai-schedule-service/src/services/ai.service.ts` to mock/call Gemini API for topic metadata.
- [ ] T018 [US1] Implement transactional save logic (Plan + Topics + Sessions) in `services/ai-schedule-service/src/services/plan.service.ts`.
- [ ] T019 [P] [US1] Register `POST /plans` route in `services/ai-schedule-service/src/routes/plan.routes.ts`.
- [ ] T020 [US4] Implement `PlanController.getOne` in `services/ai-schedule-service/src/controllers/plan.controller.ts` with aggregation.
- [ ] T021 [P] [US4] Register `GET /plans/:id` route in `services/ai-schedule-service/src/routes/plan.routes.ts`.
- [ ] T022 [US2] Implement `SessionController.list` in `services/ai-schedule-service/src/controllers/session.controller.ts` with date range filtering.
- [ ] T023 [P] [US2] Register `GET /sessions` route in `services/ai-schedule-service/src/routes/session.routes.ts`.

## Phase 4: Async Rescheduling System
**Goal**: Adaptive self-correction without extending exam dates.

- [ ] T024 [P] [US3] Configure Redis connection and BullMQ `rescheduleQueue` in `services/ai-schedule-service/src/queues/reschedule.queue.ts`.
- [ ] T025 [US2] Implement `SessionController.updateStatus` in `services/ai-schedule-service/src/controllers/session.controller.ts`.
- [ ] T026 [US3] Add logic to trigger `rescheduleQueue` job on status change (SKIPPED/PARTIAL) in `services/ai-schedule-service/src/services/session.service.ts`.
- [ ] T027 [US3] Implement `RescheduleWorker` in `services/ai-schedule-service/src/workers/reschedule.worker.ts`.
- [ ] T028 [US3] Implement `recalculateSchedule` logic in `services/ai-schedule-service/src/services/schedulingEngine.ts` (reuse or extend existing engine).
- [ ] T029 [US3] Implement atomic transaction (DELETE future + INSERT new) in `services/ai-schedule-service/src/services/plan.service.ts`.
- [ ] T030 [US3] Configure Dead Letter Queue (DLQ) and retry policy in `services/ai-schedule-service/src/queues/reschedule.queue.ts`.
- [ ] T031 [US3] Create integration test for rescheduling flow in `services/ai-schedule-service/tests/integration/reschedule.test.ts`.

## Phase 5: Reliability & Analytics
**Goal**: Production hardening and insights.

- [ ] T032 [US1] Add `opossum` circuit breaker to `AIService` in `services/ai-schedule-service/src/services/ai.service.ts`.
- [ ] T033 [US4] Implement `PlanController.getAnalytics` in `services/ai-schedule-service/src/controllers/plan.controller.ts`.
- [ ] T034 [US4] Implement logic to calculate Coverage %, Risk Score, and Velocity in `services/ai-schedule-service/src/services/analytics.service.ts`.
- [ ] T035 [P] [US4] Register `GET /plans/:id/analytics` route in `services/ai-schedule-service/src/routes/plan.routes.ts`.
- [ ] T036 [P] Create load test script `scripts/load-test-plans.js` for 100 concurrent plan generations.
- [ ] T037 [P] Create load test script `scripts/load-test-sessions.js` for 1000 concurrent session updates.
