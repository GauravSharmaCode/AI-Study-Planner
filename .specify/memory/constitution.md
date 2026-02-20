<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial constitution)
Modified principles: N/A (new constitution)
Added sections:
  - Core Principles (7 principles derived from project documentation)
  - Development Workflow Standards
  - Quality Gates & Compliance
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ aligned
  - .specify/templates/spec-template.md: ✅ aligned
  - .specify/templates/tasks-template.md: ✅ aligned
Follow-up TODOs: None
-->

# AI Study Planner Constitution

## Core Principles

### I. Schema-First Design (NON-NEGOTIABLE)
All inbound data MUST be validated with Zod schemas at service boundaries. TypeScript types MUST be inferred from schemas using `z.infer<typeof Schema>`. Never trust external data from HTTP requests, environment variables, or databases.

**Rationale:** Ensures type safety end-to-end, prevents runtime errors from malformed data, and eliminates duplicate type definitions.

**Rules:**
- Zod schemas defined near controllers or in `src/schemas/`
- All request envelopes validated (body, params, query, headers)
- Environment variables validated at startup with Zod
- UUIDs, emails, dates, enums validated with appropriate refinements

### II. Service Decoupling (NON-NEGOTIABLE)
Services MUST NOT import code from other services. Inter-service communication MUST occur via HTTP through the NGINX gateway. Each service maintains its own copy of shared contracts in `src/schemas/`.

**Rationale:** Enables independent deployment, scaling, and testing of services. Prevents circular dependencies and tight coupling.

**Rules:**
- No cross-service imports (e.g., `services/user-service` → `services/ai-schedule-service`)
- All inter-service calls via `http://localhost:8080` (NGINX gateway)
- Shared Zod schemas versioned per service
- Service URLs configured via environment variables

### III. Structured Logging (NON-NEGOTIABLE)
Use structured loggers (`winston` in ai-schedule-service, `@gauravsharmacode/neat-logger` in user-service). NEVER use `console.*` except temporary debugging. All logs MUST include context (correlationId, userId).

**Rationale:** Enables production debugging, observability, and correlation of requests across services.

**Rules:**
- Entry/exit logging for business functions
- State changes logged with old → new values
- Sensitive fields (password, token, secret) MUST be sanitized
- Log levels: debug, info, warn, error
- Never log secrets or stack traces in production

### IV. Typed Error Handling
Create and use typed error classes (`AppError` or `HttpError` with status, code, message). Express error handling MUST be centralized in middleware. External calls (DB, AI, HTTP) MUST be wrapped with try/catch.

**Rationale:** Consistent error responses, prevents information leakage, enables proper error tracking.

**Rules:**
- Custom error classes extend base `AppError`
- Error responses: `{ status: 'fail' | 'error', message, details? }`
- 4xx errors = 'fail', 5xx errors = 'error'
- Never expose stack traces in production responses
- Correlation IDs included in error context

### V. Test Independence
User stories MUST be independently testable and deployable. Each user story should deliver a viable MVP. Tests (when included) MUST be written first and fail before implementation (TDD where applicable).

**Rationale:** Enables incremental delivery, reduces risk, provides clear validation checkpoints.

**Rules:**
- User stories prioritized (P1, P2, P3) with independent tests
- Contract tests for API endpoints
- Integration tests for user journeys
- Mock external dependencies (DB, AI, Redis) in unit tests
- Descriptive test names: `"should [action] with [condition]"`

### VI. TypeScript Strictness
All services MUST use `strict: true` with comprehensive strict checks. Prefer `unknown` over `any`. Do NOT import from `dist/` directories. Indexed access is unchecked by default (`noUncheckedIndexedAccess: true`).

**Rationale:** Catches type errors at compile time, enforces defensive programming, maintains code quality.

**Rules:**
- `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` enabled
- `noUncheckedIndexedAccess: true` (user-service)
- `exactOptionalPropertyTypes: true` (user-service)
- Do not suppress type errors with `@ts-ignore` unless justified
- All services extend `tsconfig.base.json`

### VII. Containerization & Docker-First Deployment
Full Docker support for one-command deployment. All services MUST have Dockerfiles and be orchestrated via `docker-compose.yml`. Database migrations MUST be automated.

**Rationale:** Ensures consistent environments across development, testing, and production.

**Rules:**
- Multi-stage builds for optimization
- Health checks defined for all services
- Non-root user in containers
- Named volumes for data persistence
- Restart policies: `unless-stopped`

## Development Workflow Standards

### Git Workflow
- **Default branch**: `dev` (never commit directly)
- **Branch prefixes**: `feature/`, `fix/`, `refactor/`, `chore/`, `docs/`
- **PR target**: Always `dev`, never `main`
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)

### File & Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files/Directories | `kebab-case` | `user-controller.ts`, `auth-routes/` |
| Variables/Functions | `camelCase` | `getUserById`, `const userId` |
| Types/Interfaces/Classes | `PascalCase` | `UserDto`, `ApiError` |
| Constants/Env Variables | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `PORT` |
| DTOs | Suffix with `Dto` | `CreateUserDto`, `LoginResponseDto` |

### Import Organization
Group imports in this order (blank line between groups):
1. Node.js built-ins (`http`, `path`, `async_hooks`)
2. External libraries (`express`, `axios`, `zod`)
3. Internal modules (`./config`, `./routes`, `./services`)

### Formatting (Prettier)
- Semicolons: **on**
- Single quotes
- 2-space indent
- 120-char line limit (soft)
- Trailing commas where valid

## Quality Gates & Compliance

### Pre-Implementation Checklist
- [ ] Constitution Check passed (all principles validated)
- [ ] User stories prioritized and independently testable
- [ ] Technical stack clarified (no NEEDS CLARIFICATION items)
- [ ] Project structure documented in plan.md

### Code Review Requirements
- All PRs MUST verify constitution compliance
- Complexity MUST be justified (YAGNI principle)
- Tests MUST pass (if included in feature)
- Linting MUST pass (`npm run lint`)
- Formatting MUST pass (`npm run format`)

### Testing Gates
- Unit tests: Mock all external dependencies
- Integration tests: Use `supertest` for HTTP endpoints
- Contract tests: Validate API schemas
- Coverage: Optional unless explicitly requested

### Deployment Checklist
- Docker build successful (`docker-compose build`)
- Health checks passing (`/health` endpoints)
- Database migrations deployed (`prisma migrate deploy`)
- Environment variables validated at startup

## Governance

**This constitution supersedes all other development practices.** Amendments require:
1. Documentation of the proposed change
2. Approval via PR review
3. Migration plan for existing code (if applicable)
4. Version bump following semantic versioning

### Versioning Policy
- **MAJOR**: Backward-incompatible changes (principle removal, redefinition)
- **MINOR**: New principle added or material expansion of guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review
- All PRs/reviews MUST verify constitution compliance
- Violations MUST be documented with justification in Complexity Tracking table
- Use `.specify/templates/plan-template.md` Constitution Check section
- Runtime guidance in `QWEN.md`, `AGENTS.md`, and Amazon Q memory bank MUST align

### Guiding Files
- **Primary**: `.specify/memory/constitution.md` (this file)
- **Runtime guidance**: `QWEN.md`, `AGENTS.md`, `README.md`
- **Templates**: `.specify/templates/*.md`
- **Amazon Q memory bank**: `.amazonq/rules/memory-bank/*.md`

**Version**: 1.0.0 | **Ratified**: 2026-02-19 | **Last Amended**: 2026-02-19
