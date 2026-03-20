# Dashboard & Timeline Design

**Created**: 2026-03-20

## Overview

Implement the Daily Brief Dashboard and Timeline views for the AI Study Planner frontend. These pages allow students to view their daily study sessions and mark them as complete, partial, or skipped.

## Architecture

- **Routing**: Next.js App Router (`/dashboard`, `/timeline`)
- **State**: useEffect + existing api.ts (no TanStack Query for now)
- **Styling**: Inline styles (matching existing wizard)

## Data Flow

1. On page load, fetch user's active plan via `GET /api/v1/plans`
2. Filter sessions by date (today for dashboard, selected date for timeline)
3. Display sessions in SessionCard components
4. On action (complete/skip/partial), call `PATCH /api/v1/sessions/:id/status`
5. Refetch plan after status update

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/plans` | Get all user's plans |
| GET | `/api/v1/plans/:id` | Get plan with sessions |
| PATCH | `/api/v1/sessions/:id/status` | Update session status |

## Session Status Values

- `PENDING` - Not yet studied
- `COMPLETED` - Finished
- `PARTIAL` - Partially completed (requires completedMinutes)
- `SKIPPED` - Skipped (triggers reschedule)

## Components

### Dashboard Page (`/dashboard`)
- Header: "Today's Study Plan" with exam name
- Stats bar: Sessions completed / total today
- Session list: Today's sessions with actions
- Link to full timeline

### Timeline Page (`/timeline`)
- Date navigation (prev/next day, date picker)
- Session list for selected date
- Same session actions as dashboard

### SessionCard Component
- Topic name (with revision badge if isRevision)
- Subject tag
- Time range (startTime - endTime)
- Duration display
- Status badge
- Action buttons (Complete, Partial, Skip)

## Actions UI

- **Complete**: Immediately mark as COMPLETED
- **Partial**: Show input for completed minutes, then mark as PARTIAL
- **Skip**: Immediately mark as SKIPPED (triggers async reschedule)

## Error Handling

- Show inline error message if API call fails
- Disable buttons during pending API calls (loading state)
- Show toast/notification on success

## Acceptance Criteria

1. Dashboard shows today's sessions on load
2. Timeline allows navigating to any date
3. SessionCard displays all session info with correct styling
4. Complete/Skip actions work with API
5. Partial action prompts for minutes before saving
6. Loading states shown during API calls
7. Error states handled gracefully