# Test & Build Fix Plan (staging unblock) - REVISED

Goal
Restore green build and tests so the services can deploy to staging ASAP. Focus on the smallest safe set of fixes to remove TypeScript/build blockers first, then stabilize tests.

Scope

- Services: ai-schedule-service, user-service
- Tooling: Jest, Prisma, Docker
- Timeframe: immediate fixes to unblock build; tests stabilized right after

## CRITICAL FIXES (Build Blockers)

1. **Immediate build unblock (ai-schedule-service)**
   
   1.0 **CRITICAL: Complete truncated studyPlanService.ts**
   - Issue: Build logs show file truncated at `createSessionsFromPlan` method
   - Action: Complete the missing method implementation
   - Rationale: Incomplete file will cause build failure

   1.1 **Prisma middleware error (database.ts:53)**
   - Action: remove `prisma.$use(queryLogger())` usage. Keep `$on('error'|'warn'|'query')` event listeners only.
   - Rationale: Prisma v6 typed log config doesn't support `$use` as coded; `$on` provides sufficient diagnostics.

   1.2 **Controller type errors (studyPlanController.ts lines 49, 76, 105)**
   - **CORRECTED ANALYSIS**: These are `req.params.id` type issues, not body params
   - Action: cast route params to strings before service calls:
     - Line 49 (getStudyPlan): `const id = String(req.params.id)`
     - Line 76 (updateSessionStatus): `const id = String(req.params.id)`  
     - Line 105 (updateSessionRemarks): `const id = String(req.params.id)`
   - Rationale: Express types expose params as `string | string[]`; services expect `string`.

**Acceptance for Section 1**
- docker compose build completes for ai-schedule-service

## POST-BUILD FIXES

2. **Core test failures — ai-schedule-service**
   
   2.1 **Logger import "createLogger is not a function"**
   - **CORRECTED ANALYSIS**: Root cause is export/import inconsistency, not just test environment
   - Action: 
     - First: Verify logger.ts has proper named export: `export const createLogger = (...) => ...`
     - Ensure all imports use: `import { createLogger } from '../utils/logger'`
     - Add test-safe guard to avoid file transports when `NODE_ENV === 'test'`
   - Fallback: Add Jest module mock for winston if exports can't be fixed quickly

   2.2 **basic.test.ts truthiness failure**
   - Action: compute booleans explicitly: `const hasAll = Boolean(subjects?.length) && typeof availableHoursPerDay==='number' && Boolean(targetCompletionDate) && Boolean(userId)`

**Acceptance for Section 2**
- ai-schedule-service unit tests run (integration can be toggled; see Section 4)

3. **Core test failures — user-service**
   
   3.1 **Read-only property assignments in tests**
   - Action: replace direct assignment with spies:
     - `jest.spyOn(authUtils, 'hashPassword').mockResolvedValue(...)`
     - `jest.spyOn(authUtils, 'correctPassword').mockResolvedValue(...)`

   3.2 **Missing method on mocked model (findManyWithPagination)**
   - Action: `jest.spyOn(UserModel, 'findManyWithPagination').mockResolvedValue(...)`

   3.3 **bcrypt missing types**
   - Action: `npm install --save-dev @types/bcrypt` (fastest fix)
   - Alternative: Create `__mocks__/bcrypt.ts` manual mock

   3.4 **Logger & logs directory side effects in tests (EEXIST)**
   - Action: in user-service logger, avoid file transports in `NODE_ENV==='test'`

**Acceptance for Section 3**
- user-service unit tests pass locally without DB

4. **Integration tests and database availability**
   
   **CORRECTED ANALYSIS**: Errors show wrong ports and missing test DB config, not just auth issues
   - Current failures: `localhost:5433` vs `localhost:5432`, missing test credentials
   - **Primary fix**: Correct test database configuration first
   - **Fallback policy**: Skip integration tests unless `TEST_DB=on` and DATABASE_URL is reachable
   - Action: 
     - Fix DATABASE_URL in test environments to use correct ports/credentials
     - Add guard at top of integration test files: `if (process.env.TEST_DB !== 'on') { describe.skip('integration', () => { /* ... */ }); }`
   - Longer-term: provide docker-compose.test.yml that launches test Postgres

**Acceptance for Section 4**
- CI runs only unit tests by default and passes; integration tests run only when TEST_DB=on

## IMPLEMENTATION ORDER (REVISED)

5. **Exact changes to implement (CRITICAL FIRST)**
   
   **A. ai-schedule-service/src/services/studyPlanService.ts**
   - Complete the truncated `createSessionsFromPlan` method
   - Ensure file ends properly with all methods implemented

   **B. ai-schedule-service/src/config/database.ts**
   - Remove `prisma.$use(queryLogger())`
   - Keep `$on('error'|'warn'|'query')` listeners; gate verbose logs behind `NODE_ENV!=='production'`

   **C. ai-schedule-service/src/controllers/studyPlanController.ts**
   - Fix `req.params.id` type casting in three methods (lines 49, 76, 105)

   **D. ai-schedule-service/src/utils/logger.ts**
   - Verify exports: ensure both named and default exports work
   - Add test environment file transport guards:
     `const transports = process.env.NODE_ENV==='test' ? [new winston.transports.Console(...)] : [File..., File..., Console...]`

   **E. Test database configuration**
   - Fix DATABASE_URL in test environments (port/credentials)
   - Add integration test skip guards as fallback

   **F. user-service tests**
   - Replace all assignments to mockAuthUtils.X with `jest.spyOn(...)`
   - Add `@types/bcrypt` dependency
   - Add spy for UserModel.findManyWithPagination
   - Ensure user-service logger avoids filesystem in tests

6. **Validation commands**

- Unit tests only (fast):
  - `npm run test --workspaces --if-present -- --testPathIgnorePatterns=integration`
- Build validation:
  - `docker compose build --no-cache`
- Full suite with DB (developer only):
  - Start Postgres: `docker compose up -d user-db schedule-db`
  - Set `TEST_DB=on` and run: `npm test`

7. **Rollback/risks**

- Removing `$use()` only reduces query-level logging; functionality unaffected
- Logger transport gating only impacts test environment
- **NEW RISK**: Incomplete studyPlanService.ts could break existing functionality if not completed properly

8. **Timeline (REVISED)**

- **CRITICAL Section (A-C)**: ~45-60 minutes
- **Logger & Test fixes (D-F)**: ~90-120 minutes  
- **Integration test config**: ~30-45 minutes
- **Total**: ~2.5-3.5 hours (was previously underestimated)

## Notes

- **PRIORITY**: Complete studyPlanService.ts first - this is blocking the build
- After critical fixes, re-run docker build to ensure staging deploy unblocks
- Integration test fixes can be done in parallel with staging deployment