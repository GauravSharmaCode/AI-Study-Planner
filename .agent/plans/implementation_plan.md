# Fix Docker Build Errors – user-service

Two TypeScript errors are preventing the `user-service` Docker image from building successfully.

---

## Proposed Changes

### Error 1 – `UserRole` Enum Mismatch

**Root cause:** [convertToUserResponse(user)](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#13-33) is called with the result of `prisma.user.update/create` (typed as `Prisma.$Enums.UserRole`) but the function expects [User](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/interfaces.ts#9-25) (from [src/interfaces.ts](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/interfaces.ts), which uses the local `export enum UserRole`). TypeScript treats these as different nominal types even though the string values are identical.

**Where it breaks:** [UserModel.ts](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts) at calls to [convertToUserResponse](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#13-33) on lines 417 and 461.

**Fix:** Add a type cast at each [convertToUserResponse](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#13-33) call site so the Prisma result is coerced to [User](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/interfaces.ts#9-25). The `role` field values are identical strings at runtime — the cast is safe.

#### [MODIFY] [UserModel.ts](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts)

- Line ~114 (inside [create](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#63-126)): `return convertToUserResponse(user as User);`
- Line ~163 (inside [findById](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#127-178)): `return convertToUserResponse(user as User);`
- Line ~349 (inside [findMany](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#295-385)): already uses `user as User` — no change needed.
- Line 417 (inside [update](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#386-429)): change `return convertToUserResponse(user);` → `return convertToUserResponse(user as User);`
- Line 461 (inside [softDelete](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#430-473)): change `return convertToUserResponse(user);` → `return convertToUserResponse(user as User);`

---

### Error 2 – `esModuleInterop` Missing in Docker tsconfig

**Root cause:** [authRoutes.ts](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/routes/authRoutes.ts) uses `import express, { Request, Response } from 'express'` (default import style). The service-level [tsconfig.json](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/tsconfig.json) extends [tsconfig.base.json](file:///c:/Users/Gaurav/projects/AI-Study-Planner/tsconfig.base.json), which does set `"esModuleInterop": true`. However, the service [tsconfig.json](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/tsconfig.json) also includes `"ts-node": { "esm": true }` which overrides module resolution in the ts-node/ESM context and may cause issues.

More critically, TypeScript's error TS1259 means the compiler is not seeing `esModuleInterop: true`. This can happen when the Docker `npm run build` picks up a different `tsconfig` resolution than expected (e.g., the `include` pattern in the service tsconfig restricts what is extended).

**Fix:** Explicitly add `"esModuleInterop": true` and `"allowSyntheticDefaultImports": true` directly inside the service-level `compilerOptions` in [services/user-service/tsconfig.json](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/tsconfig.json) so it is never in doubt, and remove the `ts-node.esm` flag which is irrelevant for `tsc` Docker builds (it only affects `ts-node` runtime).

#### [MODIFY] [tsconfig.json](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/tsconfig.json)

```diff
 {
   "extends": "../../tsconfig.base.json",
   "compilerOptions": {
     "outDir": "./dist",
-    "rootDir": "./src"
+    "rootDir": "./src",
+    "esModuleInterop": true,
+    "allowSyntheticDefaultImports": true
   },
   "include": ["src/**/*", "prisma/generated/client/**/*"],
   "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts", "tests/**/*"],
-  "ts-node": {
-    "esm": true
-  }
 }
```

> [!NOTE]
> The `ts-node.esm: true` setting conflicts with CommonJS module compilation used in this service and is not needed for Docker builds. Removing it prevents potential module resolution divergence.

---

## Verification Plan

### Automated Tests

Run existing unit tests to ensure [UserModel](file:///c:/Users/Gaurav/projects/AI-Study-Planner/services/user-service/src/models/UserModel.ts#62-511) and `UserService` behaviour is unaffected:

```bash
# From repo root
cd services/user-service
npx jest tests/unit/userService.test.ts
```

Run all user-service tests:
```bash
npm run test:user
```

### Local TypeScript Build

```bash
cd services/user-service
npm run build
```
Should complete with **exit code 0** and no TypeScript errors.

### Docker Build

```bash
# From repo root
docker-compose build user-service
```
Should complete successfully without the TS2345 or TS1259 errors seen previously.
