# Feature Specification: Deterministic Study Planner & Scheduling Engine

**Feature Branch**: `001-study-planner`
**Created**: 2024-05-22
**Status**: Draft
**Input**: User description: "Production-grade AI-powered study scheduling backend built using a microservices architecture."

## User Scenarios & Testing

### User Story 1 - Create Study Plan (Priority: P1)

As a student, I want to input my exam date, available hours, and subjects so that I can get a balanced, deterministic study schedule.

**Why this priority**: Core value proposition. Without a plan, there is no application.

**Independent Test**: Can be tested by POSTing valid plan configuration to `/plans` and verifying a `201 Created` response with a schedule that respects constraints (max 90m sessions, spaced revision).

**Acceptance Scenarios**:

1. **Given** valid inputs (subjects, exam date > today, daily hours), **When** I submit the request, **Then** a plan is created with sessions split by topic, including spaced revisions (+3, +7, +14 days).
2. **Given** an "overloaded" input (too many topics for the time remaining), **When** I submit the request, **Then** the system rejects the plan with a clear error message.
3. **Given** a request, **When** processed, **Then** the output is deterministic (same input = same schedule).

---

### User Story 2 - Track Session Completion (Priority: P1)

As a student, I want to mark sessions as completed, skipped, or partially done so that I can track my progress.

**Why this priority**: Necessary for the adaptive engine to know the current state.

**Independent Test**: Can be tested by PATCHing a session status and verifying the update in the DB.

**Acceptance Scenarios**:

1. **Given** a pending session, **When** I mark it as "completed", **Then** the status updates and actual duration is recorded.
2. **Given** a session, **When** I mark it as "skipped" or "partial", **Then** the system triggers an asynchronous background job for rescheduling.

---

### User Story 3 - Adaptive Rescheduling (Priority: P2)

As a student, I want my schedule to automatically adjust when I miss a session, so that I stay on track without extending my exam date.

**Why this priority**: Key differentiator from static calendars.

**Independent Test**: Can be tested by mocking a "skipped" event and verifying the background worker recalculates future sessions without touching past ones.

**Acceptance Scenarios**:

1. **Given** a plan with a skipped session, **When** the rescheduling job runs, **Then** the skipped topic is re-allocated to future available slots.
2. **Given** a rescheduling event, **When** the new workload exceeds daily capacity, **Then** the system marks the plan as "At Risk" (or fails gracefully per business rule) but does NOT extend the exam date.
3. **Given** a rescheduling event, **When** processed, **Then** all future sessions are deleted and recreated, while past/completed sessions remain untouched.

---

### User Story 4 - View Analytics (Priority: P3)

As a student, I want to see my study coverage and risk level so that I can adjust my effort.

**Why this priority**: Provides visibility and motivation.

**Independent Test**: Can be tested by querying the analytics endpoint and verifying calculations against DB state.

**Acceptance Scenarios**:

1. **Given** an active plan, **When** I request analytics, **Then** I see accurate Coverage %, Remaining Workload, and Risk Score.

---

### Edge Cases

- **Exam Date Too Soon**: If the exam date is tomorrow but topics require 100 hours, generation must fail.
- **Timezone Boundary**: User inputs local time; system must convert to UTC and handle "midnight" correctly for the user's perception of a "day".
- **AI Failure**: If the heuristic AI call fails (timeout/error), the system must handle it (retry/circuit breaker) or fail the creation gracefully.

## Requirements

### Functional Requirements

- **FR-001**: System MUST transform (Exam date, Daily hours, Subjects/Topics) into a deterministic schedule.
- **FR-002**: System MUST split large topics into sessions with max duration of 90 minutes.
- **FR-003**: System MUST insert revision sessions at +3, +7, and +14 days from the original study session.
- **FR-004**: Revision sessions MUST be 25% of the original topic duration.
- **FR-005**: System MUST NOT allow overlapping sessions.
- **FR-006**: System MUST trigger async rescheduling when a session status changes to "skipped" or "partial".
- **FR-007**: Rescheduling MUST recalculate remaining workload and redistribute it evenly.
- **FR-008**: Rescheduling MUST NEVER extend the exam date or modify past sessions.
- **FR-009**: System MUST reject plan generation if workload exceeds capacity (Overload protection).
- **FR-010**: System MUST provide analytics: Coverage %, Remaining workload, Risk score, Study velocity.

### Non-Functional Requirements

- **NFR-001 (Architecture)**: Microservices architecture (User Service, AI Schedule Service, NGINX Gateway).
- **NFR-002 (Database)**: PostgreSQL per service (no shared DB).
- **NFR-003 (Queue)**: Redis (BullMQ) for async background jobs.
- **NFR-004 (Time)**: All date fields stored in DateTime (UTC). Timezone conversion only at API boundary.
- **NFR-005 (Reliability)**: AI call timeout ≤8s, Circuit breaker, Exponential backoff retry.
- **NFR-006 (Reliability)**: Dead-letter queue for failed reschedules.
- **NFR-007 (Reliability)**: Idempotent job deduplication by `planId`.
- **NFR-008 (Security)**: JWT authentication, RBAC, Zod input validation.
- **NFR-009 (Performance)**: Plan generation < 2s (excluding AI), Reschedule < 3s (≤150 topics).
- **NFR-010 (Concurrency)**: Support 10k concurrent active users.

### Key Entities

- **User**: Managed by User Service.
- **StudyPlan**: The overarching configuration (exam date, subjects) and aggregate state.
- **StudySession**: Individual time blocks (Topic X, Start, End, Status).
- **Topic**: (Implicit or Explicit) Metadata about the subject matter (Difficulty, Estimated Duration).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Plan generation latency is under 2 seconds (excluding external AI latency).
- **SC-002**: 100% of generated schedules have ZERO overlapping sessions.
- **SC-003**: Rescheduling completes in under 3 seconds for plans with ≤150 topics.
- **SC-004**: System successfully handles a simulated load of 10k concurrent active users.
- **SC-005**: 100% of failed AI calls are handled via retry/circuit breaker without crashing the service.
