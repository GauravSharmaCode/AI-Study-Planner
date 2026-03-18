# Backend Prerequisites for Phase 6 Frontend

Small backend fixes identified during the spec review that must land before frontend integration.

## Proposed Changes

### Session Route Auth

#### [MODIFY] [sessionRoutes.ts](file:///d:/projects/ai-study-planner/services/ai-schedule-service/src/routes/sessionRoutes.ts)

Add [protect](file:///d:/projects/ai-study-planner/services/ai-schedule-service/src/middleware/auth.ts#15-70) middleware to the session router, matching how [studyPlanRoutes.ts](file:///d:/projects/ai-study-planner/services/ai-schedule-service/src/routes/studyPlanRoutes.ts) applies it:

```diff
 import express from 'express';
 import studyPlanController from '../controllers/studyPlanController';
 import { validateRequest } from '../middleware/validateRequest';
+import { protect } from '../middleware/auth';
 import {
     UpdateSessionStatusSchema,
     UpdateSessionRemarksSchema
 } from '../schemas';

 const router = express.Router();

+// All session routes require authentication
+router.use(protect);
```

No other changes needed — the existing [protect](file:///d:/projects/ai-study-planner/services/ai-schedule-service/src/middleware/auth.ts#15-70) middleware extracts `userId` from the `Authorization: Bearer` header and attaches it to `req.userId`.

---

### Dead Code Cleanup

#### [DELETE] [scheduleRoutes.ts](file:///d:/projects/ai-study-planner/services/ai-schedule-service/src/routes/scheduleRoutes.ts)

Empty file (0 bytes). Not imported anywhere. Delete it.

---

## Verification Plan

### Automated Tests

1. **TypeScript build check** — confirm no compile errors after changes:
   ```bash
   cd d:\projects\ai-study-planner\services\ai-schedule-service
   npx tsc --noEmit
   ```

2. **New unit test** — add `src/routes/__tests__/sessionRoutes.test.ts` that verifies [protect](file:///d:/projects/ai-study-planner/services/ai-schedule-service/src/middleware/auth.ts#15-70) is applied to the session router. This will be a simple test that imports the router and checks the middleware stack.

   Run with:
   ```bash
   cd d:\projects\ai-study-planner\services\ai-schedule-service
   npx jest src/routes/__tests__/sessionRoutes.test.ts
   ```
