"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "../components/SessionCard";
import { apiGetJson, apiPatchJson } from "../lib/api";
import { useRescheduleStatus } from "../hooks/useRescheduleStatus";
import { getLocalToday, utcToLocalDateString, formatDateDisplay, addDays, isToday } from "../lib/dateUtils";

interface Session {
  id: string;
  topic: string;
  subject?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  isRevision: boolean;
  status: "pending" | "completed" | "partial" | "skipped";
  completedMinutes?: number;
  remarks?: string;
}

interface Plan {
  planId: string;
  version: number;
  examName?: string;
  sessions: Session[];
}

export default function TimelinePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalToday());

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiGetJson("/api/v1/plans");
      if (!ok) {
        setError(data?.message || "Failed to fetch plans");
        return;
      }
      const activePlan = data.data?.find((p: any) => p.isActive);
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

  const { isRescheduling, triggerReschedulePoll } = useRescheduleStatus(
    plan?.planId,
    plan?.version,
    fetchPlan
  );

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

  const getSessionsForDate = (date: string): Session[] => {
    if (!plan?.sessions) return [];
    return plan.sessions.filter((s) => {
      const sessionDate = utcToLocalDateString(s.date);
      return sessionDate === date;
    });
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
        if (status === "partial" || status === "skipped") {
          triggerReschedulePoll();
        } else {
          await fetchPlan();
        }
      }
    } catch (err) {
      setError("Failed to update session");
    } finally {
      setUpdatingSession(null);
    }
  };

  const navigateDate = (days: number) => {
    setSelectedDate(addDays(selectedDate!, days));
  };

  const formatDateDisplay = (dateStr: string) => {
    return formatDateDisplay(dateStr);
  };

  const sessions = getSessionsForDate(selectedDate);
  const completedCount = sessions.filter((s) => s.status === "completed").length;

  if (loading && !plan) {
    return (
      <div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading timeline...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <h2 style={{ marginBottom: "12px" }}>No Plan Active</h2>
        <button onClick={() => router.push("/wizard")} className="claude-button claude-button-primary">
          Build a Plan
        </button>
      </div>
    );
  }

  return (
    <div className="claude-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <button onClick={() => router.push("/dashboard")} className="claude-button" style={{ border: "none", paddingLeft: 0 }}>
          ← <span style={{ textDecoration: "underline" }}>Dashboard</span>
        </button>
        <button onClick={() => router.push("/analytics")} className="claude-button">
          📊 Stats
        </button>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Timeline</h1>
        {plan.examName && <p style={{ color: "var(--text-secondary)" }}>{plan.examName}</p>}
      </div>

      {isRescheduling && (
        <div style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", color: "var(--status-info)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
          <div className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid rgba(59, 130, 246, 0.2)", borderTopColor: "currentColor", borderRadius: "50%" }}></div>
          <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Optimizing schedule...</span>
        </div>
      )}

      <div className="claude-card" style={{ marginBottom: "32px", padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigateDate(-1)} className="claude-button" style={{ width: "40px", height: "40px", padding: 0 }}>
            ←
          </button>
          
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{formatDateDisplay(selectedDate)}</div>
            {isToday(selectedDate) && (
              <span className="claude-badge" style={{ marginTop: "4px", backgroundColor: "var(--accent-color)", color: "white" }}>
                Today
              </span>
            )}
            <div style={{ marginTop: "12px" }}>
              <input
                type="date"
                className="claude-input"
                value={selectedDate}
                onChange={(e: any) => setSelectedDate(e.target.value)}
                style={{ width: "auto", display: "inline-block", padding: "4px 8px" }}
              />
            </div>
          </div>

          <button onClick={() => navigateDate(1)} className="claude-button" style={{ width: "40px", height: "40px", padding: 0 }}>
            →
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {sessions.length === 0 ? (
          <div className="claude-card" style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ color: "var(--text-muted)" }}>No sessions scheduled for this date.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "12px", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
               <span>Schedule</span>
               <span>{completedCount} / {sessions.length} complete</span>
            </div>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onComplete={(id) => handleStatusUpdate(id, "completed")}
                onPartial={(id, mins) => handleStatusUpdate(id, "partial", mins)}
                onSkip={(id) => handleStatusUpdate(id, "skipped")}
                loading={updatingSession === session.id || isRescheduling}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
