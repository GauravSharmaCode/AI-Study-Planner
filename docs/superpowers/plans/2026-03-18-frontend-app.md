\*\*\* Begin Patch

# Frontend Phase 6 Implementation Plan

> I'm using the writing-plans skill to create the implementation plan.

**Goal:** Build a mobile-first Next.js 14+ frontend that consumes the AI Study Planner backend to implement Phase 6: onboarding wizard, daily timeline, session management, async rescheduling, and analytics.

**Architecture:** Thin client that talks to the NGINX gateway at http://localhost:8080, using /api/v1 endpoints. Frontend state is synchronized via TanStack Query; forms are validated with React Hook Form + Zod. Authentication uses Bearer tokens (no cookies).

**Tech Stack:** Next.js 14+ (App Router), TypeScript, vanilla CSS, React, TanStack Query, React Hook Form, Zod, Axios.

---

## Plan Overview

- This plan assumes the frontend lives under `apps/web` as a Next.js App Router project and defers PWA and Framer Motion polish to later phases.
- Testing: Unit + Integration using Jest + React Testing Library with MSW for API mocking.
- Execution approach: Inline execution (plan is executed in this session) with iterative commits and validations.

---

## Task N: Frontend Phase 6 Tasks

### 1) Project Scaffolding

- **Files to Create:**
  - `apps/web/package.json` (workspace-local scaffolding)
  - `apps/web/tsconfig.json` (extends root tsconfig.base.json)
  - `apps/web/next.config.js`
  - `apps/web/app/layout.tsx`
  - `apps/web/app/page.tsx`
  - `apps/web/app/error.tsx`
  - `apps/web/app/(core)/page.tsx` (landing shell)
- **What this does:** boots a minimal Next.js app with App Router, ready for the onboarding wizard and timeline routes.
- **Notes:** Use the repo's existing workspaces configuration in the root; no new dependencies beyond standard Next.js setup.
- **Acceptance:** App boots at http://localhost:3000 (dev) with a basic layout.

### 2) API Client & Auth Skeleton

- **Files to Create:**
  - `apps/web/app/lib/api.ts` (Axios instance with base URL and auth header logic)
  - `apps/web/app/context/AuthContext.tsx` (token storage in React context; in-memory by spec, with optional localStorage backup)
- **What this does:** centralizes HTTP calls and token handling; provides `useAuth` for login state.
- **Acceptance:** Login screen can fetch and store a token; subsequent requests include `Authorization: Bearer` header.

### 3) Onboarding Wizard (Phase 6)

- **Files to Create/Modify:**
  - `apps/web/app/wizard/step1/page.tsx` (Exam Name + Target Date)
  - `apps/web/app/wizard/step2/page.tsx` (Subjects Multi-select / tag input)
  - `apps/web/app/wizard/step3/page.tsx` (Hours per day + start time)
  - `apps/web/app/wizard/step4/page.tsx` (AI generation feedback/loading)
  - `apps/web/app/wizard/step5/page.tsx` (Plan review & finalization)
  - Shared component: `apps/web/app/components/PlanWizard.tsx` (stepper, validation, navigation)
- **Validation:** Use Zod schemas imported from backend (in plan docs) for structure where possible.
- **API Calls:** `POST /api/v1/plans/generate` to generate plan; `PUT /api/v1/plans/:id` for metadata changes; `POST /api/v1/plans/:id/reschedule` if needed.
- **Acceptance:** Wizard completes with a created plan payload and redirects to the plan review screen.

### 4) Daily Brief Dashboard & Timeline (Phase 6)

- **Files to Create/Modify:**
  - `apps/web/app/dashboard/page.tsx` (Daily Brief header)
  - `apps/web/app/timeline/[date].tsx` (Timeline for selected date with session cards)
  - `apps/web/app/components/SessionCard.tsx` (UI for all session rows)
- **Interactions:** Display Subject, Topic Name, Duration; status actions: Complete, Partial (with input), Skip; optional Remarks patch endpoint; optimistic updates via TanStack Query.
- **Acceptance:** UI renders today’s sessions, supports status updates with responsive feedback.

### 5) Async Rescheduling UI

- **Files to Create/Modify:**
  - `apps/web/app/hooks/useRescheduleStatus.ts` (polling hook to GET /plans/:id and watch `version`)
  - Update timeline/session cards to show skeleton loader or “AI Rebalancing” badge when rescheduling is in progress
- **Logic:** After a status update triggers reschedule, invalidate related queries and begin poll every 2s until `version` changes.
- **Acceptance:** Poll stops when version increments; UI refreshes with new plan data.

### 6) Analytics View

- **Files to Create/Modify:**
  - `apps/web/app/analytics/page.tsx` (Analytics UI)
  - `apps/web/app/components/AnalyticsChart.tsx` (simple charts, use SVG for no deps)
- **Data:** Fetch `/api/v1/plans/:id/analytics` and render velocity, coverage, risk metrics.
- **Acceptance:** Basic velocity chart and risk indicator render with responsive layout.

### 7) Testing Strategy

- **Files to Create/Modify:**
  - `apps/web/__tests__/` with component tests for Wizard, Timeline, and Auth context
  - MSW handlers under `apps/web/src/mocks/` to simulate API responses
- **Approach:** Unit tests for UI components; integration tests for wizard flow; use Jest + RTL + MSW.

### 8) Accessibility & UX polish (optional follow-up)

- Ensure contrast, focus states, and keyboard navigation for all wizard steps and timeline controls.

### 9) Linters & Format

- Run `npm run lint` and `npm run format` at the end; fix any TypeScript or lint issues.

### 10) Commit & Review

- Commit plan doc changes and new scaffold in logical chunks with meaningful messages.
- Plan review via plan-reviewer subagent as per the workflow.

---

## Acceptance Criteria (for Phase 6 Frontend)

- App boots with core shell and routing; onboarding wizard can navigate between steps.
- Wizard submits data to `/plans/generate` and receives a plan payload.
- Daily Brief and Timeline render with sample plan data; status actions trigger API calls with optimistic updates.
- Rescheduling flows correctly poll for version changes and reflect updates.
- Analytics view shows basic metrics from `/plans/:id/analytics`.
- Tests cover critical components and API interactions via MSW.

---

## Plan Review & Handoff

- After plan creation, dispatch a plan-reviewer subagent to validate the document against the spec and plan scope.
- If issues found, fix and re-dispatch; up to 3 iterations.
- On approval, proceed to execution (inline or subagent-driven) per user preference.

---

## Execution Options

- Plan complete and saved to `docs/superpowers/plans/2026-03-18-frontend-app.md`.
- Two execution options: 1) Subagent-Driven (recommended), 2) Inline Execution (executing-plans).

### Next Actions

- I will implement this plan in code in subsequent steps, starting with scaffolding the `apps/web` app and core pages.

End of Plan
