# Implementation Plan - Deterministic Study Planner

## Phase 1: Data Layer Migration
**Goal**: Transition from JSON-heavy schema to structured `Topic` and `Session` models.

1. **Update User Service Schema**: Add `UserRole` enum and verify fields.
   - Run `prisma migrate dev` (User Service).
2. **Refactor AI Schedule Schema**: Implement the new `Topic`, `StudyPlan`, `StudySession` models with strict enums.
   - **Migration**: Drop existing tables (if pre-production) or create migration script to map `plan: Json` -> `Topic` rows.
   - Run `prisma migrate dev` (AI Schedule Service).
3. **Seed Data**: Create seed script for dev environment with 5 mock users and 1 complex study plan each.

## Phase 2: Core Scheduling Engine (The "Brain")
**Goal**: Implement the deterministic algorithm in `services/ai-schedule-service/src/services/schedulingEngine.ts`.

1. **Implement `generateSchedule()`**:
   - Input: `Topic[]`, `startDate`, `examDate`, `dailyHours`.
   - Logic: Time slot allocation, conflict avoidance.
2. **Implement Spaced Repetition**:
   - Add revisions at +3, +7, +14 days.
   - Logic: Prioritize revisions over new topics in daily slots.
3. **Unit Tests**:
   - Verify deterministic output (same input -> same output).
   - Verify constraint handling (max 90m sessions).
   - Verify error throwing on "Impossible Plan" (Overload).

## Phase 3: API & Orchestration
**Goal**: Expose endpoints and integrate AI heuristics.

1. **`POST /plans`**:
   - Validate input with Zod.
   - Call Gemini AI (or mock) for `Topic` metadata (estimation/difficulty).
   - Call `schedulingEngine.generateSchedule`.
   - Transactional save (Plan + Topics + Sessions).
2. **`GET /plans/:id`**:
   - Fetch plan with aggregated progress.
3. **`GET /sessions`**:
   - Filter by date range (Calendar view).

## Phase 4: Async Rescheduling System
**Goal**: Adaptive self-correction without extending exam dates.

1. **Setup BullMQ**:
   - Configure Redis connection in `ai-schedule-service`.
   - Create `rescheduleQueue`.
2. **`PATCH /sessions/:id/status`**:
   - Update session status (SKIPPED/PARTIAL/COMPLETED).
   - Push job to `rescheduleQueue` if status != COMPLETED.
3. **Implement Worker**:
   - Fetch Plan & Remaining Topics.
   - Recalculate schedule from *Tomorrow*.
   - **Critical**: `DELETE` future sessions, `INSERT` new sessions (Atomic Transaction).
4. **Dead Letter Queue**:
   - Configure retry (3 attempts) + DLQ for failed jobs.

## Phase 5: Reliability & Analytics
**Goal**: Production hardening.

1. **AI Circuit Breaker**:
   - Wrap Gemini calls with `opossum` or simple timeout/fallback logic.
   - Fallback: Use default 60m estimation if AI fails.
2. **Analytics Endpoint**:
   - `GET /plans/:id/analytics`.
   - Calculate Coverage % (Completed Topics / Total Topics).
   - Calculate Risk Score (Remaining Hours / Remaining Days vs Daily Limit).
3. **Load Testing**:
   - Script 100 concurrent plan generations.
   - Script 1000 concurrent session updates.
   - Verify DB CPU and Redis memory.

## Migration Strategy (from MVP)

Since the current system uses a `plan: Json` blob, we cannot easily migrate active plans without parsing the JSON.
**Decision**:
- **Archive** all existing plans (set status = ARCHIVED).
- Require users to **Create New Plan** to benefit from the new engine.
- This avoids complex JSON-to-Relational mapping logic for a prototype-to-production shift.
