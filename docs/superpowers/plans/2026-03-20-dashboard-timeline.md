# Dashboard & Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Daily Brief Dashboard and Timeline views for viewing and managing study sessions.

**Architecture:** Simple useEffect + fetch pattern, inline styles matching existing wizard code, session-based API calls.

**Tech Stack:** Next.js 14 App Router, TypeScript, vanilla inline CSS

---

## File Structure

```
apps/web/app/
├── dashboard/
│   └── page.tsx          # Main dashboard with today's sessions
├── timeline/
│   └── page.tsx          # Timeline with date navigation
├── components/
│   └── SessionCard.tsx   # Reusable session display component
└── lib/
    └── api.ts            # Already exists, add PATCH method if needed
```

---

## Task 1: Add PATCH method to API client

**Files:**
- Modify: `apps/web/app/lib/api.ts`

- [ ] **Step 1: Add apiPatchJson function**

```typescript
export async function apiPatchJson<T = any>(url: string, body: any) {
  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/lib/api.ts
git commit -m "feat(frontend): add PATCH method to API client"
```

---

## Task 2: Create SessionCard component

**Files:**
- Create: `apps/web/app/components/SessionCard.tsx`

- [ ] **Step 1: Create SessionCard component**

```typescript
"use client";
import { useState } from "react";

interface Session {
  id: string;
  topic: string;
  subject?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  isRevision: boolean;
  status: "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED";
  completedMinutes?: number;
  remarks?: string;
}

interface SessionCardProps {
  session: Session;
  onComplete: (id: string) => void;
  onPartial: (id: string, minutes: number) => void;
  onSkip: (id: string) => void;
  loading?: boolean;
}

export default function SessionCard({
  session,
  onComplete,
  onPartial,
  onSkip,
  loading,
}: SessionCardProps) {
  const [showPartial, setShowPartial] = useState(false);
  const [partialMinutes, setPartialMinutes] = useState("");

  const handlePartial = () => {
    const mins = parseInt(partialMinutes, 10);
    if (mins > 0 && mins < session.plannedMinutes) {
      onPartial(session.id, mins);
      setShowPartial(false);
      setPartialMinutes("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#22c55e";
      case "PARTIAL":
        return "#f59e0b";
      case "SKIPPED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        backgroundColor: session.status === "COMPLETED" ? "#f0fdf4" : "#fff",
        opacity: session.status === "SKIPPED" ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>{session.topic}</span>
            {session.isRevision && (
              <span
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0369a1",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                Revision
              </span>
            )}
          </div>
          {session.subject && (
            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                backgroundColor: "#f3f4f6",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#4b5563",
              }}
            >
              {session.subject}
            </span>
          )}
          <div style={{ marginTop: "8px", color: "#6b7280", fontSize: "14px" }}>
            {formatTime(session.startTime)} - {formatTime(session.endTime)} ({session.plannedMinutes} min)
          </div>
        </div>
        <span
          style={{
            backgroundColor: getStatusColor(session.status),
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {session.status}
        </span>
      </div>

      {session.status === "PENDING" && (
        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          <button
            onClick={() => onComplete(session.id)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Complete
          </button>
          <button
            onClick={() => setShowPartial(!showPartial)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Partial
          </button>
          <button
            onClick={() => onSkip(session.id)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Skip
          </button>
        </div>
      )}

      {showPartial && (
        <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="number"
            value={partialMinutes}
            onChange={(e) => setPartialMinutes(e.target.value)}
            placeholder="Minutes"
            min="1"
            max={session.plannedMinutes - 1}
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              width: "80px",
            }}
          />
          <button
            onClick={handlePartial}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowPartial(false);
              setPartialMinutes("");
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {session.status === "PARTIAL" && session.completedMinutes && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#f59e0b" }}>
          Completed: {session.completedMinutes} minutes
        </div>
      )}

      {session.remarks && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
          Note: {session.remarks}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/components/SessionCard.tsx
git commit -m "feat(frontend): create SessionCard component"
```

---

## Task 3: Create Dashboard page

**Files:**
- Create: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Create Dashboard page**

```typescript
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "../components/SessionCard";
import { apiGetJson, apiPatchJson } from "../lib/api";

interface Session {
  id: string;
  topic: string;
  subject?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  isRevision: boolean;
  status: "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED";
  completedMinutes?: number;
  remarks?: string;
}

interface Plan {
  planId: string;
  examName?: string;
  subjects: string[];
  sessions: Session[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = (globalThis as any).localStorage?.getItem("auth_token") ?? null;
    } catch {
      token = null;
    }
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchPlan();
  }, [router]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiGetJson("/api/v1/plans");
      if (!ok) {
        setError(data.message || "Failed to fetch plans");
        return;
      }
      // Find active plan
      const activePlan = data.data?.find((p: Plan) => p.isActive);
      if (activePlan) {
        // Fetch full plan with sessions
        const { ok: planOk, data: planData } = await apiGetJson(`/api/v1/plans/${activePlan.planId}`);
        if (planOk) {
          setPlan(planData.data);
        }
      }
    } catch (err) {
      setError("Failed to load plan");
    } finally {
      setLoading(false);
    }
  };

  const getTodaySessions = (): Session[] => {
    if (!plan?.sessions) return [];
    const today = new Date().toISOString().split("T")[0];
    return plan.sessions.filter((s) => s.date.startsWith(today));
  };

  const handleStatusUpdate = async (sessionId: string, status: string, completedMinutes?: number) => {
    try {
      setUpdatingSession(sessionId);
      const body: any = { status };
      if (completedMinutes !== undefined) {
        body.completedMinutes = completedMinutes;
      }
      const { ok } = await apiPatchJson(`/api/v1/sessions/${sessionId}/status`, body);
      if (ok) {
        // Refresh plan data
        await fetchPlan();
      }
    } catch (err) {
      setError("Failed to update session");
    } finally {
      setUpdatingSession(null);
    }
  };

  const todaySessions = getTodaySessions();
  const completedCount = todaySessions.filter((s) => s.status === "COMPLETED").length;

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>Loading your study plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>No active study plan found.</p>
        <button
          onClick={() => router.push("/wizard")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create Plan
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        Today&apos;s Study Plan
      </h1>
      {plan.examName && (
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>{plan.examName}</p>
      )}

      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <div style={{ fontSize: "14px", color: "#6b7280" }}>Today&apos;s Progress</div>
        <div style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>
          {completedCount} / {todaySessions.length} sessions completed
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {todaySessions.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
          No sessions scheduled for today.
        </p>
      ) : (
        todaySessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onComplete={(id) => handleStatusUpdate(id, "COMPLETED")}
            onPartial={(id, mins) => handleStatusUpdate(id, "PARTIAL", mins)}
            onSkip={(id) => handleStatusUpdate(id, "SKIPPED")}
            loading={updatingSession === session.id}
          />
        ))
      )}

      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <button
          onClick={() => router.push("/timeline")}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#3b82f6",
            border: "1px solid #3b82f6",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          View Full Timeline
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/page.tsx
git commit -m "feat(frontend): create dashboard page with today's sessions"
```

---

## Task 4: Create Timeline page

**Files:**
- Create: `apps/web/app/timeline/page.tsx`

- [ ] **Step 1: Create Timeline page with date navigation**

```typescript
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "../components/SessionCard";
import { apiGetJson, apiPatchJson } from "../lib/api";

interface Session {
  id: string;
  topic: string;
  subject?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  isRevision: boolean;
  status: "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED";
  completedMinutes?: number;
  remarks?: string;
}

interface Plan {
  planId: string;
  examName?: string;
  sessions: Session[];
}

export default function TimelinePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = (globalThis as any).localStorage?.getItem("auth_token") ?? null;
    } catch {
      token = null;
    }
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchPlan();
  }, [router]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiGetJson("/api/v1/plans");
      if (!ok) {
        setError(data.message || "Failed to fetch plans");
        return;
      }
      const activePlan = data.data?.find((p: Plan) => p.isActive);
      if (activePlan) {
        const { ok: planOk, data: planData } = await apiGetJson(`/api/v1/plans/${activePlan.planId}`);
        if (planOk) {
          setPlan(planData.data);
        }
      }
    } catch (err) {
      setError("Failed to load plan");
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForDate = (date: string): Session[] => {
    if (!plan?.sessions) return [];
    return plan.sessions.filter((s) => s.date.startsWith(date));
  };

  const handleStatusUpdate = async (sessionId: string, status: string, completedMinutes?: number) => {
    try {
      setUpdatingSession(sessionId);
      const body: any = { status };
      if (completedMinutes !== undefined) {
        body.completedMinutes = completedMinutes;
      }
      const { ok } = await apiPatchJson(`/api/v1/sessions/${sessionId}/status`, body);
      if (ok) {
        await fetchPlan();
      }
    } catch (err) {
      setError("Failed to update session");
    } finally {
      setUpdatingSession(null);
    }
  };

  const navigateDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const sessions = getSessionsForDate(selectedDate);
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>Loading your study plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>No active study plan found.</p>
        <button
          onClick={() => router.push("/wizard")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create Plan
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#3b82f6",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Timeline</h1>
      {plan.examName && (
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>{plan.examName}</p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f9fafb",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => navigateDate(-1)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ← Previous
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>{formatDateDisplay(selectedDate)}</div>
          {isToday && (
            <span
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              Today
            </span>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              marginTop: "8px",
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          onClick={() => navigateDate(1)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Next →
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
          No sessions scheduled for this date.
        </p>
      ) : (
        <>
          <div style={{ marginBottom: "16px", color: "#6b7280" }}>
            {completedCount} / {sessions.length} completed
          </div>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onComplete={(id) => handleStatusUpdate(id, "COMPLETED")}
              onPartial={(id, mins) => handleStatusUpdate(id, "PARTIAL", mins)}
              onSkip={(id) => handleStatusUpdate(id, "SKIPPED")}
              loading={updatingSession === session.id}
            />
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/timeline/page.tsx
git commit -m "feat(frontend): create timeline page with date navigation"
```

---

## Task 5: Verify and test

**Files:**
- Test: Manual browser testing

- [ ] **Step 1: Start the frontend dev server**

```bash
cd apps/web && npm run dev
```

- [ ] **Step 2: Test login flow**
- Navigate to http://localhost:3000/auth/login
- Login with valid credentials

- [ ] **Step 3: Test dashboard**
- After login, navigate to /dashboard
- Verify today's sessions load
- Test Complete, Partial, Skip buttons

- [ ] **Step 4: Test timeline**
- Navigate to /timeline
- Test date navigation (prev/next)
- Test date picker

- [ ] **Step 5: Commit any final changes**

```bash
git add -A
git commit -m "feat(frontend): complete dashboard and timeline pages"
```

---

## Acceptance Criteria Verification

- [ ] Dashboard shows today's sessions on load
- [ ] Timeline allows navigating to any date
- [ ] SessionCard displays all session info with correct styling
- [ ] Complete/Skip actions work with API
- [ ] Partial action prompts for minutes before saving
- [ ] Loading states shown during API calls
- [ ] Error states handled gracefully

---

## Plan Complete

Tasks: 5
Steps: 11