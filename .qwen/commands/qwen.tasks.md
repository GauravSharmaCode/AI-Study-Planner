---
description: Generate dependency-ordered task list from design artifacts (AI Study Planner adapted)
est_time: 3-5 min
stage: Task Breakdown
handoffs:
  - label: Analyze Consistency
    agent: speckit.analyze
    prompt: Run consistency analysis
    send: false
  - label: Implement Feature
    agent: speckit.implement
    prompt: Start implementation
    send: false
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Generate executable `tasks.md` organized by user story with clear dependencies and parallelization opportunities.

## Execution Steps

### 1. Check Prerequisites

Run from repo root:
```bash
if [ -f ".specify/scripts/bash/check-prerequisites.sh" ]; then
  .specify/scripts/bash/check-prerequisites.sh --json
else
  echo "Manual check: Ensure spec.md and plan.md exist"
fi
```

Parse:
- `FEATURE_DIR` - Feature directory
- `AVAILABLE_DOCS` - List: `spec.md`, `plan.md`, `data-model.md`, `contracts/`, etc.

**Required**: `spec.md`, `plan.md`
**Optional**: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

### 2. Load Design Documents

**From plan.md**:
- Tech stack (TypeScript, Express, Prisma, PostgreSQL, Redis)
- Architecture (microservices, NGINX gateway)
- File structure
- Service boundaries

**From spec.md**:
- User stories with priorities (P1, P2, P3...)
- Functional requirements
- Non-functional requirements
- Edge cases

**From data-model.md** (if exists):
- Entities (User, StudyPlan, Session, etc.)
- Relationships
- Validation rules

**From contracts/** (if exists):
- API endpoints
- Request/response schemas
- Test requirements

**From research.md** (if exists):
- Technical decisions
- Alternatives considered
- Best practices

### 3. Extract User Stories

Parse `spec.md` for user stories:

```markdown
## User Stories
- US1 (P1): As a user, I want to create a study plan so that I can organize my learning
- US2 (P1): As a user, I want to view my study sessions so that I know what to study
- US3 (P2): As a user, I want to mark sessions complete so that I can track progress
- US4 (P3): As a user, I want email notifications so that I remember to study
```

**Extract**:
- Story ID: US1, US2, ...
- Priority: P1 (critical), P2 (important), P3 (nice-to-have)
- Description: User goal and benefit
- Related requirements: FR-1, FR-3, etc.

### 4. Generate Tasks by Phase

**Phase Structure**:

```
Phase 1: Setup
Phase 2: Foundational
Phase 3: User Story 1 (P1)
Phase 4: User Story 2 (P1)
Phase 5: User Story 3 (P2)
...
Final Phase: Polish
```

#### Phase 1: Setup Tasks

Project initialization:

```text
- [ ] T001 Initialize project structure per plan.md
- [ ] T002 [P] Create docker-compose.yml with PostgreSQL, Redis services
- [ ] T003 [P] Create .env.example with required variables
- [ ] T004 Install dependencies (express, prisma, zod, etc.)
- [ ] T005 [P] Initialize Prisma schema
- [ ] T006 [P] Create tsconfig.json with strict mode
- [ ] T007 [P] Setup ESLint + Prettier configs
- [ ] T008 Create README with setup instructions
```

**AI Study Planner Specific**:
- Docker services: user-db (5432), schedule-db (5433), redis (6379)
- NGINX gateway configuration
- Prisma setup for both services

#### Phase 2: Foundational Tasks

Blocking prerequisites (must complete before user stories):

```text
- [ ] T009 Create shared Zod schemas in src/schemas/index.ts
- [ ] T010 [P] Implement HttpError class in src/utils/errors.ts
- [ ] T011 [P] Setup logger (winston/neat-logger) in src/utils/logger.ts
- [ ] T012 [P] Create Express app factory in src/app.ts
- [ ] T013 [P] Implement global error handling middleware
- [ ] T014 [P] Implement request validation middleware
- [ ] T015 Create health check endpoint GET /health
- [ ] T016 Setup Prisma client singleton
```

#### Phase 3+: User Story Tasks

**For Each User Story** (in priority order):

**Template**:
```text
## Phase N: User Story [ID] - [Story Description]
Priority: P[N]
Goal: [Independent, testable increment]
Test Criteria: [How to verify story complete without running full app]

### Tasks

- [ ] T[NN] [P] [USN] Create [Entity] model in src/models/[entity].ts
- [ ] T[NN] [USN] Create Zod schema for [Entity] validation
- [ ] T[NN] [P] [USN] Implement [Entity]Service in src/services/[name].ts
- [ ] T[NN] [P] [USN] Implement [Entity]Controller in src/controllers/[name].ts
- [ ] T[NN] [USN] Create Express routes in src/routes/[name].ts
- [ ] T[NN] [USN] Wire up routes in main app.ts
- [ ] T[NN] [P] [USN] Write integration tests in tests/[entity].test.ts
- [ ] T[NN] [USN] Test manual: [curl command or scenario]
```

**Example: US1 - Create Study Plan**:

```text
## Phase 3: User Story 1 - Create Study Plan
Priority: P1
Goal: User can create AI-powered study plan via POST /plans
Test Criteria: POST /plans returns 201 with plan object, plan saved to DB

### Tasks

- [ ] T017 [P] [US1] Create StudyPlan model in prisma/schema.prisma
- [ ] T018 [US1] Add StudyPlan Zod schema to src/schemas/index.ts
- [ ] T019 [P] [US1] Implement PlanService in src/services/planService.ts
- [ ] T020 [P] [US1] Implement PlanController in src/controllers/planController.ts
- [ ] T021 [US1] Create POST /plans route in src/routes/planRoutes.ts
- [ ] T022 [US1] Wire up plan routes in src/app.ts
- [ ] T023 [P] [US1] Write plan creation tests in tests/plan.test.ts
- [ ] T024 [US1] Test: POST /plans with valid data returns 201
```

**Parallelization Rules**:
- `[P]` marker: Task can run in parallel with other `[P]` tasks
- Different files, no dependencies on incomplete tasks
- Same-file tasks: Always sequential

#### Final Phase: Polish

Cross-cutting concerns:

```text
## Phase N: Polish & Cross-Cutting Concerns

- [ ] T[NN] Add request logging middleware
- [ ] T[NN] Implement rate limiting for API endpoints
- [ ] T[NN] Add API documentation (Swagger/OpenAPI)
- [ ] T[NN] Setup CI/CD pipeline configuration
- [ ] T[NN] Create deployment runbook
- [ ] T[NN] Performance optimization (database indexes, caching)
- [ ] T[NN] Security audit (CORS, helmet, input sanitization)
- [ ] T[NN] Update README with API examples
```

### 5. Generate Dependency Graph

**User Story Completion Order**:

```text
## Dependencies

Setup (Phase 1)
  └─> Foundational (Phase 2)
       └─> US1 (Phase 3)
            └─> US2 (Phase 4)
                 └─> US3 (Phase 5)
                      └─> Polish (Final)
```

**Within Each Story**:
```
Models → Services → Controllers → Routes → Tests → Integration
```

**Parallel Opportunities**:
```text
## Parallel Execution Examples

Phase 2 (Foundational):
  - T010 (errors.ts) || T011 (logger.ts) || T012 (app.ts)
  - T013 (error middleware) || T014 (validation middleware)

Phase 3 (US1):
  - T017 (model) || T018 (schema)
  - T019 (service) || T020 (controller)
```

### 6. Create tasks.md File

Use template structure:

```markdown
# Tasks: [Feature Name]

**Generated**: [DATE]
**Branch**: [branch-name]
**Spec**: [spec.md path]
**Plan**: [plan.md path]

## Execution Strategy

- **MVP Scope**: User Stories 1-2 (P1 only)
- **Phase 2**: User Story 3 (P2)
- **Phase 3**: Polish & optimization

## Dependencies

[Dependency graph from step 5]

## Parallel Execution

[Parallel opportunities from step 5]

---

## Phase 1: Setup

- [ ] T001 [Description with file path]
- [ ] T002 [P] [Description with file path]

## Phase 2: Foundational

- [ ] T009 [Description with file path]

## Phase 3: User Story 1 - [Story Name]

**Goal**: [Independent testable increment]
**Test Criteria**: [How to verify without full app]

- [ ] T017 [P] [US1] [Description with file path]

## Phase N: Polish

- [ ] T[NN] [Description with file path]

---

## Implementation Notes

- Run `npm run build` after each phase
- Test with `npm run test`
- Docker: `docker-compose up -d`
- Health check: `curl http://localhost:8080/health`
```

### 7. Format Validation

**Validate ALL tasks**:

```text
✅ Checkbox: Starts with "- [ ]"
✅ Task ID: Sequential (T001, T002, ...)
✅ [P] marker: Only for parallelizable tasks
✅ [USN] label: Only for user story phase tasks
✅ File path: Exact path included in description
```

**Invalid Examples** (reject and fix):
- ❌ `- [ ] Create User model` (missing ID, path)
- ❌ `T001 [US1] Create model` (missing checkbox)
- ❌ `- [ ] T001 Create model` (missing file path)

### 8. Report Completion

```text
✅ tasks.md generated

Path: [FEATURE_DIR/tasks.md]
Total tasks: N

## Breakdown

| Phase | Task Count |
|-------|------------|
| Setup | 8 |
| Foundational | 8 |
| US1 | 8 |
| US2 | 6 |
| US3 | 5 |
| Polish | 7 |

## Parallel Opportunities

- Phase 2: 4 parallel tasks
- Phase 3: 3 parallel tasks
- Total parallelizable: N/M tasks (X%)

## Independent Test Criteria

- US1: [Test criteria]
- US2: [Test criteria]
- US3: [Test criteria]

## MVP Scope

User Stories 1-2 (P1 only): T001-T0XX

## Format Validation

✅ All tasks follow checklist format
✅ All tasks include file paths
✅ Task IDs sequential
✅ Story labels correct

Next command: /qwen:implement
```

## Task Generation Rules

### Organization by User Story

**Primary**: User stories from `spec.md`

**Map to stories**:
- Models needed for that story
- Services for that story's business logic
- Endpoints/UI for that story
- Tests specific to that story

**Entity Mapping** (from `data-model.md`):
- Entity serves one story → Put in that story's phase
- Entity serves multiple stories → Put in earliest story or Foundational

**Contract Mapping** (from `contracts/`):
- Endpoint serves one story → Tasks in that story
- Shared endpoint (auth, health) → Foundational phase

### Task Description Quality

**Good** (specific, executable):
- ✅ `- [ ] T012 [P] [US1] Create User model in src/models/user.ts`
- ✅ `- [ ] T015 [US1] Implement POST /plans endpoint in src/routes/planRoutes.ts`

**Bad** (vague, missing context):
- ❌ `- [ ] Create model`
- ❌ `- [ ] Implement endpoint`

### AI Study Planner Specifics

**Service Boundaries**:
- User Service tasks: `services/user-service/src/...`
- Schedule Service tasks: `services/ai-schedule-service/src/...`
- NGINX tasks: `apps/nginx-gateway/...`

**Shared Contracts**:
- Each service has own `src/schemas/index.ts`
- Do NOT import across services (use HTTP via NGINX)

**Database**:
- User Service: PostgreSQL on 5432
- Schedule Service: PostgreSQL on 5433
- Prisma migrations per service

**Testing**:
- Jest for unit/integration tests
- `supertest` for HTTP endpoints
- Mock external dependencies (DB, AI, Redis)

## Context

$ARGUMENTS
