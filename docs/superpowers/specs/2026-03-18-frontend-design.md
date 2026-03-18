# Design Spec: Phase 6 - Frontend Application (Mobile-First Daily Companion)

**Date:** 2026-03-18
**Status:** Draft
**Project:** AI Study Planner
**Author:** Gemini CLI

---

## 1. Executive Summary
The Phase 6 frontend is a modern, responsive web application designed as a "Daily Companion" for students preparing for high-stakes examinations. It prioritizes a "Zen" user experience, focusing on reducing anxiety through a clear daily timeline and seamless AI-powered rescheduling.

## 2. Technical Stack
- **Framework:** Next.js 14+ (App Router) with TypeScript.
- **Styling:** Vanilla CSS for responsive design; Framer Motion for "fluid" animations.
- **State & Data:** TanStack Query (React Query) for server-state synchronization and optimistic UI updates.
- **Form Handling:** React Hook Form + Zod (reusing backend schemas where possible).
- **Authentication:** JWT-based auth via User Service, transmitted as `Authorization: Bearer <token>` header on every API request. Token is stored in-memory (React state/context) and optionally persisted in `localStorage` for session continuity.

## 3. Core Architecture
The frontend acts as a thin, reactive client communicating with the existing **NGINX Gateway** at `http://localhost:8080`.

### API Base Path
All backend API calls use the versioned prefix: **`/api/v1/`**. Key endpoints:

| Action                   | Method  | Path                                 |
|--------------------------|---------|--------------------------------------|
| Generate plan            | `POST`  | `/api/v1/plans/generate`             |
| Get plan (+ poll version)| `GET`   | `/api/v1/plans/:id`                  |
| Get all plans            | `GET`   | `/api/v1/plans/`                     |
| Update plan metadata     | `PUT`   | `/api/v1/plans/:id`                  |
| Delete plan              | `DELETE`| `/api/v1/plans/:id`                  |
| Trigger reschedule       | `POST`  | `/api/v1/plans/:id/reschedule`       |
| Get analytics            | `GET`   | `/api/v1/plans/:id/analytics`        |
| Update session status    | `PATCH` | `/api/v1/sessions/:id/status`        |
| Update session remarks   | `PATCH` | `/api/v1/sessions/:id/remarks`       |

### Data Flow Pattern
1. **Command:** User performs an action (e.g., "Mark Session as Skipped").
2. **Optimistic Update:** UI immediately reflects the change locally.
3. **API Call:** Frontend sends a `PATCH` request to `PATCH /api/v1/sessions/:id/status` via the Gateway.
4. **Invalidation:** TanStack Query invalidates the `sessions` and `analytics` keys.
5. **Background Refresh:** The app re-fetches data once the `RescheduleWorker` (backend) completes the async job.

### Prerequisites (Backend Changes Required)
> **⚠️ IMPORTANT:** The following backend changes must be completed before frontend integration:
> 1. **Add `protect` middleware to session routes** — `sessionRoutes.ts` currently does not apply JWT authentication. The `protect` middleware must be added (see Implementation Plan).
> 2. **Set `CORS_ORIGIN`** — The NGINX gateway `CORS_ORIGIN` env var must include `http://localhost:3000` for local dev.
> 3. **Delete empty `scheduleRoutes.ts`** — Dead code that can cause confusion.

## 4. User Interface & Experience (UX)

### A. The "Daily Brief" (Dashboard Top)
A smart card that summarizes the current state of the study plan.
- **Content:** *"3 of 5 sessions done today. 2 skipped sessions have been redistributed to tomorrow to protect your June 12th exam date."*
- **Visuals:** High-contrast typography with a soft background "glow" reflecting the current status (e.g., Green for on track, Amber for rebalancing).

### B. The Vertical Timeline (Main View)
The primary interface for the "Daily Companion" vibe.
- **Layout:** A chronological list of study blocks for the selected date.
- **Data Source:** `GET /api/v1/plans/:id` returns the full plan including sessions. The frontend filters sessions client-side by `date` field to render today's schedule. The database index `@@index([studyPlanId, date])` optimizes this on the backend.
- **Interactive Elements:**
    - **Session Cards:** Display Subject, Topic Name, and Duration (`plannedMinutes`).
    - **Status Controls:**
        - `Complete` (one-tap): Marks session as 100% finished. Sends `PATCH /api/v1/sessions/:id/status` with `{ status: "COMPLETED" }`.
        - `Partial` (expandable): Opens a small input for `completedMinutes` (e.g., "Studied 30 of 45 mins"). Sends `{ status: "PARTIAL", completedMinutes: 30 }`.
        - `Skip` (one-tap): Marks session as 0% finished. Sends `{ status: "SKIPPED" }`.
    - **Remarks:** Optional text field for each session (e.g., "Struggled with integration rules"). Sends `PATCH /api/v1/sessions/:id/remarks` with `{ remarks: "..." }`.
- **Status Indicators:**
    - `PENDING`: Clean, outlined card.
    - `COMPLETED`: Desaturated background with a subtle checkmark.
    - `PARTIAL`: Half-filled progress bar on the card; "AI Rebalancing" badge.
    - `SKIPPED`: Strikethrough text with an "AI Rescheduled" badge.

### C. The Plan Generator (Onboarding Wizard)
A multi-step form to initialize the AI Schedule.
- **Step 1:** Exam Name & Target Date.
- **Step 2:** Subjects selection (Multi-select).
- **Step 3:** Available Hours Per Day & Preferred Start Time.
- **Step 4: AI Generation:** All collected inputs are submitted in a single `POST /api/v1/plans/generate` call. The backend performs AI topic estimation + deterministic scheduling in one pass. The UI shows a "Brewing your plan..." progress state during this request.
- **Step 5: Plan Review:** After generation, users review the created plan and its topics. They may use `PUT /api/v1/plans/:id` to adjust metadata or trigger a `POST /api/v1/plans/:id/reschedule` if they need to change parameters.

> **Note:** The current backend generates topics and schedules atomically in a single API call. A future iteration may split this into a two-phase flow (estimate topics → user reviews → confirm & schedule) for finer control.

### D. Analytics View
Focus on "Velocity" and "Risk."
- **Data Source:** `GET /api/v1/plans/:id/analytics`
- **Velocity Chart:** Weekly completion rate based on `completedMinutes` vs. `plannedMinutes`.
- **Coverage Progress:** Circular progress bars for each subject.
- **Risk Score:** A single metric indicating if the user is falling behind the target completion date.

## 5. Key Interactions & Edge Cases

### Async Rescheduling UI
Since the backend rescheduling is asynchronous (BullMQ), the UI must handle the "In-Progress" state:
1. **Trigger:** User marks a session as `SKIPPED` or `PARTIAL` (with `completedMinutes` < `plannedMinutes`).
2. **Polling Strategy:**
    - Frontend invalidates the `sessions` query.
    - App starts a short polling loop (every 2s) to `GET /api/v1/plans/:id`.
    - **Sync Signal:** The backend `StudyPlan` model has a `version` (int) field that increments after a successful reschedule.
    - **Resolution:** When the `version` increases, the polling stops, the skeleton loader is replaced with the new schedule, and the "Daily Brief" card updates.
3. **Optimistic Locking:** If the user tries to edit another session while a reschedule is pending, the frontend disables those controls to prevent Prisma version conflicts.


### Mobile Optimizations
- **Bottom Navigation:** Persistent icons for Home (Timeline), Plan (Overview), and Analytics.
- **PWA Features:** Manifest and Service Worker for "Add to Home Screen" support and offline viewing of today's schedule.

## 6. Security
- All API calls include the `Authorization: Bearer <token>` header.
- XSS prevention via React's default output escaping.
- Environment variable validation for API URLs.
- Input sanitization before rendering AI-generated topic names.
- CORS policy enforced at the NGINX Gateway level (`CORS_ORIGIN` env var).

---

## 7. Success Criteria
- **Performance:** Initial page load < 1.5s; TTI (Time to Interactive) < 2s.
- **Usability:** User can mark a session complete in < 2 taps.
- **Accessibility:** WCAG 2.1 Level AA compliant (essential for diverse student populations).
