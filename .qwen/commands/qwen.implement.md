---
description: Execute implementation tasks from tasks.md phase-by-phase (AI Study Planner adapted)
est_time: 15-60 min
stage: Implementation
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Execute tasks from `tasks.md` following dependency order, respecting parallelization markers, and validating completion at each phase.

## Execution Steps

### 1. Check Prerequisites

Run from repo root:
```bash
# Check for .specify script
if [ -f ".specify/scripts/bash/check-prerequisites.sh" ]; then
  .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
else
  # Fallback: manual validation
  echo "Manual check: Ensure tasks.md exists"
fi
```

Parse:
- `FEATURE_DIR` - Feature directory path
- `AVAILABLE_DOCS` - List of available artifacts

**Abort** if `tasks.md` missing: "Run `/qwen:tasks` first"

### 2. Checklist Status Check

**If `FEATURE_DIR/checklists/` exists**:

Scan all `*.md` files:
```bash
# Count checklist items
total=$(grep -c "\- \[.\]" checklists/*.md)
completed=$(grep -c "\- \[[Xx]\]" checklists/*.md)
incomplete=$((total - completed))
```

Create status table:

```text
| Checklist | Total | Completed | Incomplete | Status |
|-----------|-------|-----------|------------|--------|
| ux.md     | 12    | 12        | 0          | ✓ PASS |
| test.md   | 8     | 5         | 3          | ✗ FAIL |
```

**Overall Status**:
- **PASS**: All checklists have 0 incomplete
- **FAIL**: One or more checklists have incomplete items

**If FAIL**:
```text
⚠️  Some checklists are incomplete.

Do you want to proceed with implementation anyway? (yes/no)
```

- **yes/proceed/continue**: Continue to step 3
- **no/wait/stop**: Halt execution

**If PASS**: Display table, automatically proceed.

### 3. Load Implementation Context

**Required**:
- `tasks.md` - Complete task list and execution plan
- `plan.md` - Tech stack, architecture, file structure

**If Exists**:
- `data-model.md` - Entities, relationships
- `contracts/` - API specifications
- `research.md` - Technical decisions
- `quickstart.md` - Integration scenarios

**AI Study Planner Context**:
- TypeScript strict mode enabled
- Zod-first schema design
- Microservices boundaries (no cross-service imports)
- Docker containerization required

### 4. Project Setup Verification

**Ignore Files** (create/verify based on actual setup):

```bash
# Check git repo
if git rev-parse --git-dir 2>/dev/null; then
  # Verify .gitignore exists and contains:
  # node_modules/, dist/, build/, *.log, .env*, .DS_Store
fi

# Check for Docker (Dockerfile* exists OR "docker" in plan.md)
# → Create/verify .dockerignore

# Check ESLint (.eslintrc* OR eslint.config.*)
# → Create/verify .eslintignore OR config ignores

# Check Prettier (.prettierrc*)
# → Create/verify .prettierignore
```

**TypeScript Patterns** (AI Study Planner):
```
node_modules/
dist/
build/
*.log
.env*
.DS_Store
.vscode/
.idea/
coverage/
```

**If ignore file exists**: Append missing critical patterns only
**If missing**: Create with full pattern set

### 5. Parse tasks.md Structure

Extract from `tasks.md`:

**Task Format**:
```text
- [ ] T001 [P?] [US?] Description with file path
```

**Parse**:
- Task ID: `T001`, `T002`, ...
- `[P]` marker: Parallelizable
- `[US1]` label: User story assignment
- File paths: Extract from description
- Phase grouping: Setup, Foundational, US1, US2, ..., Polish

**Build Execution Plan**:
```typescript
interface Task {
  id: string;        // T001
  parallel: boolean; // [P] marker
  story?: string;    // [US1] label
  description: string;
  filePath: string;
  phase: string;     // Setup, US1, Polish, etc.
  status: 'pending' | 'completed' | 'failed';
}
```

**Dependency Graph**:
- Sequential tasks: Must complete in order
- Parallel tasks `[P]`: Can run together (different files, no dependencies)
- File-based coordination: Tasks affecting same file → sequential

### 6. Execute Implementation

**Phase-by-Phase Execution**:

```text
FOR EACH phase in tasks.md:
  1. Validate phase prerequisites (previous phases complete)
  2. Execute tasks in phase:
     - Sequential tasks: One at a time, in order
     - Parallel tasks [P]: Can batch together (different files)
  3. Validate phase completion
  4. Mark tasks as [X] in tasks.md
  5. Report progress
  6. IF failure in sequential task: HALT
  7. IF failure in parallel task: Continue with others, report failed
```

**Execution Order**:

1. **Setup Phase**:
   - Project structure
   - Dependencies (`npm install`)
   - Configuration (`.env`, `docker-compose.yml`)
   - Database setup (Prisma migrations)

2. **Foundational Phase**:
   - Shared utilities (logger, error classes)
   - Core infrastructure (Express app, Prisma client)
   - Middleware (auth, validation, error handling)

3. **User Story Phases** (US1, US2, ...):
   - **Tests first** (if TDD requested): Contract tests, integration tests
   - **Models**: Prisma schemas, Zod validation
   - **Services**: Business logic
   - **Controllers**: Request handlers
   - **Routes**: Express endpoints
   - **Integration**: Wire components together

4. **Polish Phase**:
   - Cross-cutting concerns (logging, monitoring)
   - Performance optimization
   - Documentation (README, API docs)
   - Final validation

**AI Study Planner Specifics**:

- **Prisma**: Run `npm run prisma:migrate` after schema changes
- **Docker**: Ensure containers healthy before service start
- **NGINX**: Update gateway config for new endpoints
- **Redis**: Configure caching for study plans

### 7. Task Execution Rules

**For Each Task**:

1. **Read task description** and file path
2. **Check if file exists**:
   - If exists: Update/extend existing code
   - If new: Create file with proper structure
3. **Implement task**:
   - Follow TypeScript strict mode
   - Use Zod for validation
   - Respect naming conventions (kebab-case files, camelCase vars)
   - Import organization (built-ins → externals → internals)
4. **Validate implementation**:
   - Type-check: `npm run build`
   - Lint: `npm run lint`
   - Test: `npm run test` (if tests exist)
5. **Mark task complete**:
   - Update `tasks.md`: Change `- [ ]` to `- [X]`
   - Save file

**Example Task Execution**:

Task: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`

```typescript
// 1. Check file exists
// 2. Create/extend src/models/user.ts

import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// 3. Run type-check
// 4. Mark task complete in tasks.md
```

### 8. Progress Tracking

**After Each Task**:
```text
✅ T012 [US1] Create User model
   File: src/models/user.ts
   Status: Complete
```

**After Each Phase**:
```text
✅ Phase: User Story 1 Complete
   Tasks: 8/8 complete
   Files created: 5
   Tests passing: 12

Next phase: User Story 2
```

**On Failure**:
```text
❌ T015 [US2] Implement AuthService
   Error: [Specific error message]
   Context: [File path, line number if available]
   
   Suggested fix: [Concrete next step]
   
   Execution halted. Fix error and re-run `/qwen:implement`
```

### 9. Completion Validation

**After All Phases**:

1. **Task Completion**:
   - All tasks marked `[X]` in `tasks.md`
   - No pending tasks remain

2. **Feature Validation**:
   - Implemented features match `spec.md` requirements
   - All functional requirements satisfied
   - Non-functional requirements met (performance, security)

3. **Code Quality**:
   - TypeScript compiles without errors: `npm run build`
   - Linting passes: `npm run lint`
   - Tests pass: `npm run test`

4. **Integration Check**:
   - Services start successfully: `docker-compose up -d`
   - Health check passes: `curl http://localhost:8080/health`
   - API endpoints respond correctly

### 10. Final Report

```text
✅ Implementation complete

Feature: [Feature name]
Branch: [Branch name]
Tasks completed: N/N
Time elapsed: [Duration]

## Summary

Files created: N
Files modified: N
Tests added: N
Endpoints added: N

## Validation

✅ TypeScript build: PASS
✅ Linting: PASS
✅ Tests: N passing
✅ Docker containers: Healthy
✅ Health check: PASS

## Next Steps

- Review changes: git diff
- Commit: git commit -m "feat: [feature description]"
- Push: git push origin [branch]
- Create PR to dev branch
```

## Error Handling

**Sequential Task Failure**:
- **Halt** execution immediately
- Report error with context
- Suggest concrete fix
- Do not mark task as complete

**Parallel Task Failure**:
- **Continue** with other parallel tasks
- Report failed tasks at phase end
- Allow user to decide: fix now or defer

**Common Errors**:

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| TypeScript errors | Type mismatch | Check Zod schema, type inference |
| Import errors | Cross-service import | Use HTTP via NGINX instead |
| DB connection | Docker not healthy | `docker-compose ps`, wait for healthy |
| Port conflict | Service already running | `docker-compose down`, restart |

## AI Study Planner Conventions

**File Structure**:
```
services/user-service/
├── src/
│   ├── config/        # DB, app config
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Auth, validation
│   ├── routes/        # Express routes
│   ├── schemas/       # Zod schemas (shared contracts)
│   ├── services/      # Business logic
│   └── prisma/        # Prisma schema
└── tests/
```

**Import Order**:
```typescript
import express from "express";         // External
import axios from "axios";             // External
import config from "./config";         // Internal
import { userService } from "./services"; // Internal
```

**Error Handling**:
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

// Use logger, never console.*
import { logWithMeta } from "@gauravsharmacode/neat-logger";
```

**Logging**:
```typescript
logWithMeta("User created", {
  func: "createUser",
  level: "info",
  extra: { userId },
});
```

## Context

$ARGUMENTS
