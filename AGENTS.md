# AGENTS Guide for AI-Study-Planner

This document is for agentic coding agents operating in this monorepo. It captures how to build, lint, test (including running a single test), and the project’s code style expectations.

## Monorepo Overview

- Root package manages workspaces under `services/*` and `apps/*` (package.json: `workspaces`).
- Primary services:
  - `services/user-service`: User management/auth; TypeScript, Express, Prisma.
  - `services/ai-schedule-service`: AI study plan; TypeScript, Express, Prisma, Google Gemini.
- Common TypeScript config at service level; build outputs go to `dist/`.
- NGINX gateway under `apps/nginx-gateway` (Dockerized; build via docker-compose).

## Node, Tooling, and Engines

- Node: root `package.json` requires `node >=20.0.0`; README suggests Node 20+ for local dev. Prefer Node 20.
- TypeScript: root `typescript ^5.7.x`; services pin TS in their own `devDependencies`.
- Jest, ts-jest in services for testing.
- ESLint present; `ai-schedule-service` temporarily disables lint scripts due to ESLint 9.x compatibility.
- Prettier available via root script; no `.prettierrc` file is present, so defaults apply.

## Build, Dev, Start Commands

- Root (build all workspaces):

  ```bash
  npm run build
  ```

  - Runs per-workspace `build` with `--if-present`. Triggers Prisma codegen where defined.

- Root (dev, both services concurrently):

  ```bash
  npm run dev
  ```

  - Uses `concurrently` to run `services/user-service` and `services/ai-schedule-service` dev scripts.

- Root (start all workspaces):

  ```bash
  npm run start
  ```

- Service-specific:
  - `services/user-service`
    ```bash
    npm run build      # prisma:generate + tsc
    npm run dev        # ts-node-dev src/index.ts (watch)
    npm run start      # node dist/index.js
    ```
  - `services/ai-schedule-service`
    ```bash
    npm run build      # prisma generate + tsc
    npm run dev        # ts-node src/index.ts
    npm run start      # node dist/index.js
    ```

## Docker Compose

- Bring up everything (DBs, Redis, services, NGINX):
  ```bash
  docker-compose up -d --build
  ```
- Shut down:
  ```bash
  docker-compose down
  ```
- Follow logs:
  ```bash
  docker-compose logs -f
  ```
- Health checks are defined in `docker-compose.yml`. Root `scripts/dev-helper.sh` exists but is currently empty.

## Linting and Formatting

- Root (lint all workspaces):
  ```bash
  npm run lint
  npm run lint:fix
  ```
- `services/ai-schedule-service/.eslintrc.js` (active config file found):
  - Extends: `eslint:recommended`, `@typescript-eslint/recommended`.
  - Parser: `@typescript-eslint/parser`; `project: ./tsconfig.json`.
  - Rules of note:
    - `no-console`: warn (prefer structured logger).
    - `@typescript-eslint/no-unused-vars`: error.
    - `@typescript-eslint/no-explicit-any`: warn.
    - Explicit return-type rules: off (allowed where helpful).
  - Ignore: `dist/`, `node_modules/`.
- `ai-schedule-service` package.json scripts currently echo that lint is disabled due to ESLint 9.x issues. Agents may run lint via `npx eslint .` inside the service using ESLint 8-compatible config if needed.
- Formatting:

  ```bash
  npm run format
  ```

  - Uses Prettier across the repo. With no `.prettierrc`, defaults apply.

## Testing (Jest + ts-jest)

- Root (run tests in all workspaces):
  ```bash
  npm run test
  ```
- Root shortcuts:
  ```bash
  npm run test:user
  npm run test:schedule
  ```
- Service-specific:
  - `services/user-service`
    ```bash
    npm run test           # jest --passWithNoTests
    npm run test:watch     # jest --watch --passWithNoTests
    npm run test:coverage  # jest --coverage --passWithNoTests
    ```
  - `services/ai-schedule-service`
    ```bash
    npm run test           # jest
    npm run test:watch     # jest --watch
    npm run test:coverage  # jest --coverage
    ```

### Running a Single Test (file or name)

- From inside a service directory:
  - By file path:
    ```bash
    npx jest src/path/to/my.test.ts
    ```
  - By test name (exact or regex):
    ```bash
    npx jest -t "should create a user"
    # or
    npx jest --testNamePattern "create.*user"
    ```
  - By file + name together:
    ```bash
    npx jest src/controllers/user.test.ts -t "create"
    ```
- Using npm scripts and forwarding args:

  ```bash
  # user-service
  npm run test -- -t "create"

  # ai-schedule-service
  npm run test -- src/plan/plan.test.ts
  ```

## TypeScript Configuration Expectations

- `strict: true` across services; treat type errors as blocking.
- Prefer `unknown` over `any`; keep `noImplicitAny: true` (user-service).
- `esModuleInterop: true`, `allowSyntheticDefaultImports: true` (user-service): default imports from CommonJS are allowed.
- `module: commonjs` in services; import style should match TS/Node CommonJS compilation targets.
- `rootDir: ./src`, `outDir: ./dist`; do not import from `dist/`.
- Test files (`**/*.test.ts`/`**/*.spec.ts`) are excluded from TS build; Jest transpiles with ts-jest.

## Imports and Module Style

- Use TypeScript `import`/`export`; compile to CommonJS.
- Group imports: Node built-ins, external libs, internal modules. Separate groups with a blank line.
- Use named imports when available; default imports where library APIs encourage them (thanks to `esModuleInterop`).
- Avoid deep relative paths (`../../..`). Prefer local indexes and small module boundaries; do not introduce path aliases unless added to `tsconfig.json` consistently in both services.
- Do not import from another service’s `src/`; communicate via HTTP APIs or shared contracts when applicable.

## Naming Conventions

- Files: `kebab-case.ts` (e.g., `user-controller.ts`).
- Variables/functions: `camelCase`.
- Types/interfaces: `PascalCase`.
- Classes/enums: `PascalCase`.
- Constants/env keys: `UPPER_SNAKE_CASE`.
- Request/response DTOs: suffix with `Dto` or be clear via Zod schema name.

## Formatting Expectations (Prettier defaults)

- Semicolons on; single quotes preferred where not enforced by Prettier; trailing commas where valid.
- 2-space indentation; 120-column soft limit recommended.
- Keep lines simple; prefer early returns over nested conditionals.
- One export per concept; co-locate small helpers when tight cohesion exists.

## Runtime Validation and Types (Zod-first)

- Validate all inbound data at service boundaries with Zod.
- Infer types from Zod schemas (`z.infer<typeof Schema>`). Avoid duplicating TypeScript types for the same shape.
- Never trust external data (HTTP, env, DB). Parse with Zod and handle failures explicitly.
- Keep schemas near controllers/routers or in `src/schemas/` per service.

## Error Handling and Logging

- Use structured logging (`winston` in `ai-schedule-service`, `@gauravsharmacode/neat-logger` in `user-service`). Avoid `console.*` except temporary debugging.
- Create and use typed error classes (e.g., `HttpError` with `status`, `code`, `message`, optional `details`).
- Express middleware: centralize error handling; send consistent JSON shape: `{ error: { code, message } }`.
- Wrap external calls (DB, HTTP, AI) with try/catch, add context to logs, and map errors to safe responses.
- Do not leak secrets or stack traces in production responses; include correlation IDs where useful.

## API Contracts and Decoupling

- Services communicate via HTTP through the NGINX gateway; do not import code across services.
- Contracts: keep Zod schemas versioned per service. When changing, bump service version and coordinate consumers.

## Environment Variables

- Required examples (see README.md):
  - `GOOGLE_GENAI_API_KEY`, `JWT_SECRET`, and DB URLs via `DATABASE_URL` in docker-compose.
- In local dev, prefer `.env` loaded via `dotenv`. Do not commit secrets.
- Validate env at startup (Zod schema or similar) and fail fast when missing.

## Cursor or Copilot Rules

- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No Copilot instructions found (`.github/copilot-instructions.md` not present).
- If added later, agents must surface and honor them in this guide.

## Agent Workflow Quick-Start

1. Install deps: `npm install` (root; installs all workspaces).
2. Run dev locally:

   ```bash
   # Terminal 1
   cd services/user-service && npm run dev
   # Terminal 2
   cd services/ai-schedule-service && npm run dev
   ```

3. Build all: `npm run build`.
4. Lint/format: `npm run lint` and `npm run format`.
5. Tests:
   - All: `npm run test`.
   - Single file/name: run `npx jest` inside the target service (see examples above).

6. Docker: `docker-compose up -d --build` and verify `http://localhost:8080/health`.

## Branching and PR Conventions

- **Default branch**: `dev` (not `main`)
- **Create feature branches**: `feature/`, `fix/`, `refactor/`
- **PR target**: Always PR to `dev`, not `main`
- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Never commit directly to `dev` or `main`** - use PRs

## Common Pitfalls

- Forgetting Prisma generate before TypeScript build: use the service `build` script (it already runs codegen), or run `npx prisma generate`.
- Relying on `console.*`: prefer service logger; ESLint warns.
- Importing `dist/` or cross-service code: avoid; respect boundaries.
- Tests failing due to env: mock external services; do not depend on real DB in unit tests.
- Lint disabled in `ai-schedule-service`: you can still run `npx eslint .` with the local `.eslintrc.js`.

## Service Cheat Sheet

- `services/user-service`:
  - Tools: Express, Prisma, JWT, bcrypt, zod.
  - Scripts: `dev`, `build`, `start`, `test`, `test:watch`, `test:coverage`, `lint`, `lint:fix`.
  - TS config: strict mode with many safety flags (`noImplicitAny`, `strictNullChecks`, etc.).

- `services/ai-schedule-service`:
  - Tools: Express, Prisma, Google GenAI, winston, zod.
  - Scripts: `dev`, `build`, `start`, `test`, `test:watch`, `test:coverage`, `lint` (temporarily disabled), `lint:fix` (temporarily disabled).
  - TS config: strict mode; CommonJS; `esModuleInterop` enabled.

## Dependency Management & Standardization

To support both monorepo efficiency and independent Docker builds:

- **Dev Dependencies**: Common tools (ESLint, Jest, Prettier) are hoisted to the root `package.json`.
- **Runtime Dependencies**: Each service's `package.json` must explicitly list its runtime dependencies (e.g., `express`, `zod`, `winston`).
- **Hybrid Dependencies**: Tools required for _both_ local dev and Docker builds (specifically `typescript`, `ts-node`, `prisma` CLI, `@types/node`) must be present in **both** the root `package.json` (for local dev consistency) and the service `package.json` (for Docker `npm install`).
- **Version Alignment**: You **MUST** ensure that versions of shared dependencies (Prisma, TypeScript, Node types) are identical across `services/user-service`, `services/ai-schedule-service`, and the root.
- **TypeScript Config**: All services extend `tsconfig.base.json` in the root to ensure consistent strictness and compiler settings.

---

Agents must keep this guide updated when tooling, workflows, or conventions change.

If you introduce or modify:

AI integration directories (.agent/, .qwen/, .opencode/, .amazonq/, etc.)

Governance files (AGENTS.md, QWEN.md, future tool-specific configs)

Scripts, CI workflows, or project-level configuration

Editor-specific rules (Cursor, Copilot, or others)

You are required to update this document to reflect the change.

No AI integration or governance change is complete unless this guide is updated accordingly.

---

## SpecKit Canonical Workflow

The canonical Spec-Driven Development lifecycle is defined only in:

```
.agent/workflows/speckit.*.md
```

These files are the single source of truth for:

Phase ordering

Validation gates

Cross-artifact checks

Constitution enforcement

Tool Adapter Rule

Tool-specific command systems (e.g., .qwen/commands/, .opencode/commands/, future integrations):

Must wrap or reference the canonical speckit.\*.md definitions

May adapt syntax or CLI formatting

Must not redefine phases

Must not introduce new mandatory lifecycle steps

Must not bypass validation gates

Must not alter canonical workflow semantics

If divergence is suspected, the agent must:

Identify the exact file

Identify the specific lines

Explain the behavioral difference

The workflow authority lives in .agent/workflows/.
All tools conform to it.
