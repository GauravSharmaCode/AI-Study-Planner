---
description: Create technical implementation plan from specification (AI Study Planner adapted)
est_time: 5-8 min
stage: Planning
handoffs:
  - label: Generate Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Transform technology-agnostic spec into concrete technical plan with architecture, data model, and API contracts.

**Run AFTER** `/qwen:specify` and `/qwen:clarify`. **Run BEFORE** `/qwen:tasks`.

## Execution Steps

### 1. Check Prerequisites

Run from repo root:
```bash
if [ -f ".specify/scripts/bash/setup-plan.sh" ]; then
  .specify/scripts/bash/setup-plan.sh --json
else
  # Manual fallback
  echo "Manual: Ensure spec.md exists in feature directory"
fi
```

Parse:
- `FEATURE_SPEC` - Path to spec.md
- `IMPL_PLAN` - Path to plan.md (output)
- `SPECS_DIR` - Specs directory
- `BRANCH` - Current branch name

**Abort** if `spec.md` missing: "Run `/qwen:specify` first"

### 2. Load Context

**Read**:
- `FEATURE_SPEC` - Feature requirements
- `.specify/memory/constitution.md` (if exists) - Project principles

**Load Plan Template** (priority order):
1. `.qwen/templates/plan-template.md`
2. `.specify/templates/plan-template.md`
3. Use default structure below

### 3. Fill Technical Context

Extract from `spec.md` and identify unknowns:

```markdown
## Technical Context

### Known (from spec)
- [Feature requirements]
- [User stories]
- [Constraints]

### NEEDS CLARIFICATION
- [Unknown 1: e.g., "Caching strategy for study plans"]
- [Unknown 2: e.g., "AI streaming vs batch processing"]
- [Unknown 3: e.g., "Notification delivery mechanism"]
```

**AI Study Planner Context**:
- TypeScript, Express.js, Prisma, PostgreSQL, Redis
- Google Gemini AI integration
- Microservices architecture (User Service, Schedule Service)
- NGINX gateway for routing
- Docker containerization

### 4. Constitution Check

If `.specify/memory/constitution.md` exists:

```markdown
## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Schema-First Design | ✅ Will use Zod schemas | All inbound data validated |
| Service Decoupling | ✅ No cross-service imports | HTTP via NGINX only |
| TypeScript Strict | ✅ strict: true in tsconfig | No `any` types |
| Logging Standards | ✅ Using neat-logger/winston | No console.* |
| Containerization | ✅ Docker support | docker-compose.yml |
```

**ERROR** if violations unjustified.

### 5. Phase 0: Research & Decisions

**For each `NEEDS CLARIFICATION`**:

Generate research task:
```text
Research: [Unknown] for [feature context]
```

**Consolidate findings** in `research.md`:

```markdown
# Technical Decisions: [Feature Name]

## Decision: [Decision topic]

**Context**: [Why this decision matters]

**Chosen**: [What was selected]

**Rationale**: [Why chosen, aligned with constitution]

**Alternatives Considered**:
- Option A: [Description] - Rejected because [reason]
- Option B: [Description] - Rejected because [reason]

**Implementation Impact**: [What this affects]
```

**AI Study Planner Common Decisions**:

1. **Caching Strategy**:
   - Decision: Redis for user sessions, study plan cache
   - TTL: 15 minutes for plans, 24 hours for user profiles
   - Invalidation: On update/delete

2. **AI Integration**:
   - Decision: Batch processing (not streaming) for MVP
   - Timeout: 30 seconds with retry (max 3 attempts)
   - Fallback: Cached plan or "AI unavailable" message

3. **Data Consistency**:
   - Decision: Eventual consistency for study plan updates
   - Source of truth: PostgreSQL
   - Cache: Redis (invalidated on write)

### 6. Phase 1: Design & Contracts

#### 6.1 Data Model (`data-model.md`)

Extract entities from `spec.md`:

```markdown
# Data Model: [Feature Name]

## Entities

### User
- id: UUID (primary key)
- email: string (unique, indexed)
- password: string (hashed)
- createdAt: datetime
- updatedAt: datetime

**Relationships**:
- One-to-many: User → StudyPlans
- One-to-many: User → Sessions

**Validation**:
- Email: Valid format, unique
- Password: Min 8 characters, hashed with bcrypt

### StudyPlan
- id: UUID (primary key)
- userId: UUID (foreign key → User.id)
- title: string
- description: text (optional)
- aiGenerated: boolean
- createdAt: datetime

**Relationships**:
- Many-to-one: StudyPlan → User
- One-to-many: StudyPlan → Sessions

### Session
- id: UUID (primary key)
- planId: UUID (foreign key → StudyPlan.id)
- topic: string
- scheduledAt: datetime
- duration: integer (minutes)
- completed: boolean
- completedAt: datetime (optional)

**Validation**:
- scheduledAt: Future date
- duration: 15-180 minutes

## Indexes
- User.email (unique)
- StudyPlan.userId
- Session.planId
- Session.scheduledAt
```

**Prisma Schema** (for AI Study Planner):

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  plans     StudyPlan[]
  sessions  Session[]
}

model StudyPlan {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String?
  aiGenerated Boolean  @default(true)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  sessions    Session[]
}

model Session {
  id          String   @id @default(uuid())
  planId      String
  topic       String
  scheduledAt DateTime
  duration    Int
  completed   Boolean  @default(false)
  completedAt DateTime?
  plan        StudyPlan @relation(fields: [planId], references: [id])
  
  @@index([planId])
  @@index([scheduledAt])
}
```

#### 6.2 API Contracts (`contracts/`)

Generate from functional requirements:

**OpenAPI/Swagger Format**:

```yaml
openapi: 3.0.0
info:
  title: AI Study Planner API
  version: 1.0.0

paths:
  /api/v1/plans:
    post:
      summary: Create study plan
      tags: [Plans]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                description:
                  type: string
                topics:
                  type: array
                  items:
                    type: string
      responses:
        '201':
          description: Plan created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StudyPlan'
        '400':
          description: Invalid input
        '401':
          description: Unauthorized

  /api/v1/plans/{id}:
    get:
      summary: Get study plan
      tags: [Plans]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Study plan details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StudyPlan'
        '404':
          description: Plan not found

components:
  schemas:
    StudyPlan:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        aiGenerated:
          type: boolean
        createdAt:
          type: string
          format: date-time
        sessions:
          type: array
          items:
            $ref: '#/components/schemas/Session'
    
    Session:
      type: object
      properties:
        id:
          type: string
          format: uuid
        topic:
          type: string
        scheduledAt:
          type: string
          format: date-time
        duration:
          type: integer
        completed:
          type: boolean
```

**Zod Schemas** (for AI Study Planner):

```typescript
// src/schemas/index.ts

import { z } from "zod";

export const createPlanSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  topics: z.array(z.string().min(1)).min(1),
});

export const updatePlanSchema = createPlanSchema.partial();

export const sessionSchema = z.object({
  topic: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(180),
});

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;
export type SessionDto = z.infer<typeof sessionSchema>;
```

#### 6.3 Quickstart (`quickstart.md`)

Integration scenarios and testing guide:

```markdown
# Quickstart: [Feature Name]

## Local Development

1. Start Docker containers:
   ```bash
   docker-compose up -d
   ```

2. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

3. Start services:
   ```bash
   npm run dev
   ```

## Testing

### Manual Testing

```bash
# Create study plan
curl -X POST http://localhost:8080/api/v1/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"My Plan","topics":["Math","Science"]}'

# Get study plan
curl http://localhost:8080/api/v1/plans/<id> \
  -H "Authorization: Bearer <token>"

# Mark session complete
curl -X PUT http://localhost:8080/api/v1/sessions/<id>/complete \
  -H "Authorization: Bearer <token>"
```

### Automated Testing

```bash
# Run tests
npm run test

# Run specific test
npx jest -t "should create study plan"
```

## Health Checks

```bash
# API health
curl http://localhost:8080/health

# Database connection
curl http://localhost:8080/health/db

# Redis connection
curl http://localhost:8080/health/redis
```
```

### 7. Update Agent Context

Run agent context update script:

```bash
if [ -f ".specify/scripts/bash/update-agent-context.sh" ]; then
  .specify/scripts/bash/update-agent-context.sh qwen
else
  echo "Manual: Update .qwen/context/project-context.md with new tech"
fi
```

**Add only new technology** from current plan. Preserve manual additions.

### 8. Re-evaluate Constitution Check

After design complete, validate again:

```markdown
## Constitution Check (Post-Design)

| Principle | Status | Evidence |
|-----------|--------|----------|
| Schema-First | ✅ | Zod schemas in src/schemas/ |
| Service Decoupling | ✅ | No cross-service imports |
| TypeScript Strict | ✅ | tsconfig.json strict: true |
| Logging | ✅ | neat-logger in controllers |
| Containerization | ✅ | docker-compose.yml updated |
```

### 9. Write plan.md

```markdown
# Implementation Plan: [Feature Name]

**Branch**: [branch-name]
**Spec**: [spec.md path]
**Created**: [DATE]

## Technical Context

[From step 3]

## Constitution Check

[From step 4 and 8]

## Architecture

[High-level architecture diagram/description]

## Data Model

[Link to data-model.md or inline schema]

## API Contracts

[Endpoints, request/response schemas]

## File Structure

```
services/
├── user-service/
│   └── src/
│       ├── schemas/
│       ├── models/
│       ├── services/
│       └── controllers/
└── ai-schedule-service/
    └── src/
        ├── schemas/
        ├── models/
        ├── services/
        └── controllers/
```

## Technical Decisions

[Link to research.md]

## Integration Points

- NGINX gateway routing
- Redis caching
- PostgreSQL migrations
- Google Gemini AI

## Testing Strategy

- Unit tests: Jest
- Integration tests: supertest
- Mock: DB, AI, Redis

## Deployment

- Docker containers
- Environment variables
- Health checks
```

### 10. Report Completion

```text
✅ Technical plan created

Branch: [branch-name]
Plan: [IMPL_PLAN path]

## Generated Artifacts

✅ plan.md - Architecture and tech stack
✅ data-model.md - Entities and relationships
✅ contracts/ - API specifications
✅ research.md - Technical decisions
✅ quickstart.md - Integration guide

## Constitution Compliance

All principles validated ✅

## Next Steps

- /qwen:tasks (generate task list)
- /qwen:checklist (create quality gates)
- /qwen:implement (start implementation)
```

## AI Study Planner Specifics

### Service Boundaries

**User Service (3001)**:
- User registration/login
- JWT authentication
- User profile management

**AI Schedule Service (3002)**:
- Study plan generation (Google Gemini AI)
- Session management
- Notifications

**NGINX Gateway (8080)**:
- Route requests to appropriate service
- Load balancing
- Rate limiting

### Communication Patterns

- **Sync**: HTTP via NGINX (user → schedule service)
- **Async**: BullMQ queues (notifications, AI processing)
- **Cache**: Redis (sessions, plans)

### Database Strategy

- **User DB** (5432): User Service data
- **Schedule DB** (5433): AI Schedule Service data
- **No cross-database queries**: Each service owns its data

## Context

$ARGUMENTS
