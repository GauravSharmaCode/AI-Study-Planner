# Codebase Audit & Findings

## 1. Security Vulnerabilities

### Unprotected Endpoints in `ai-schedule-service`
**Severity:** High
**Location:** `services/ai-schedule-service/src/routes/`
**Description:**
The endpoints for managing study plans and sessions (e.g., `/api/v1/plans/*`, `/api/v1/sessions/*`) do not have authentication middleware.
- The `user-service` has `protect` middleware, but `ai-schedule-service` relies on the client (or NGINX) to pass requests.
- The `createPlan` endpoint accepts a `userId` in the body, but does not verify if the requestor is authorized to act as that user.
- Any user could potentially create, view, or modify study plans for any other user if they know the `userId`.

**Recommendation:**
- Implement JWT verification middleware in `ai-schedule-service` (similar to `user-service`).
- Verify that the authenticated user matches the `userId` in the request.

## 2. Code Quality & Refactoring

### Duplicated Schemas (DRY Violation)
**Severity:** Medium
**Location:** `services/user-service/src/schemas/index.ts` and `services/ai-schedule-service/src/schemas/index.ts`
**Description:**
The Zod schemas (e.g., `ServiceRequestSchema`, `ServiceResponseSchema`) are duplicated across services.
- This leads to maintenance overhead and potential inconsistencies if one service updates a schema but the other doesn't.

**Recommendation:**
- Extract shared schemas, types, and utilities into a shared package (e.g., `packages/common` or `libs/shared`).
- Use npm workspaces to consume the shared package in both services.

### Brittle AI Integration
**Severity:** Medium
**Location:** `services/ai-schedule-service/src/services/studyPlanService.ts`
**Description:**
The service currently uses regex (`match(/\{.*\}/s)`) to extract JSON from the AI's text response.
- This is prone to failure if the AI adds conversational text or formatting (Markdown code blocks) around the JSON.

**Recommendation:**
- Use Google Gemini's "Structured Output" (JSON Mode) with `responseSchema` to guarantee valid JSON matching the expected type. (Note: Planned for immediate remediation).

## 3. Infrastructure & Testing

### Broken Test Suite
**Severity:** Medium
**Location:** Root `npm test`
**Description:**
Running `npm test` fails for both services.
- Error: `Preset ts-jest not found relative to rootDir`.
- It appears `ts-jest` is not correctly configured or installed in the individual workspace `node_modules`.

**Recommendation:**
- Fix `jest.config.json` in each service to correctly point to `ts-jest`.
- Ensure `ts-jest` is installed in the root or workspace dependencies correctly.

## 4. Architecture

### Inter-Service Communication
**Severity:** Low (currently)
**Description:**
There is no standardized mechanism for services to talk to each other securely (e.g., `ai-schedule-service` calling `user-service` to verify a user).
- `ServiceRequestSchema` exists, implying a pattern, but no implementation was found.

**Recommendation:**
- Implement a Service-to-Service authentication mechanism (e.g., internal API keys or mTLS).
