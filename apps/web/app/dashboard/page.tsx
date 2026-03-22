"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "../components/SessionCard";
import { apiGetJson, apiPatchJson } from "../lib/api";
import { useRescheduleStatus } from "../hooks/useRescheduleStatus";
import { getLocalToday, utcToLocalDateString } from "../lib/dateUtils";

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
  subjects: string[];
  sessions: Session[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

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

  const getTodaySessions = (): Session[] => {
    if (!plan?.sessions) return [];
    const today = getLocalToday();
    return plan.sessions.filter((s) => {
      const sessionDate = utcToLocalDateString(s.date);
      return sessionDate === today;
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

  const todaySessions = getTodaySessions();
  const completedCount = todaySessions.filter((s) => s.status === "completed").length;

  if (loading && !plan) {
    return (
      <div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading your study plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <h2 style={{ marginBottom: "12px" }}>Ready to Start?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>No active study plan found. Let&apos;s build one for your goals.</p>
        <button onClick={() => router.push("/wizard")} className="claude-button claude-button-primary">
          Create Study Plan
        </button>
      </div>
    );
  }

  return (
    <div className="claude-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Today&apos;s Sessions</h1>
          {plan.examName && <p style={{ color: "var(--text-secondary)" }}>{plan.examName}</p>}
        </div>
        <button onClick={() => router.push("/analytics")} className="claude-button">
          📊 Analytics
        </button>
      </div>

      {isRescheduling && (
        <div style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", color: "var(--status-info)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
          <div className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid rgba(59, 130, 246, 0.2)", borderTopColor: "currentColor", borderRadius: "50%" }}></div>
          <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>AI is optimizing your schedule in the background...</span>
        </div>
      )}

      <div className="claude-card" style={{ marginBottom: "32px", borderLeft: "4px solid var(--accent-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="claude-label">Daily Progress</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
              {completedCount} / {todaySessions.length} <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 400 }}>sessions completed</span>
            </div>
          </div>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: `conic-gradient(var(--accent-color) ${(completedCount / (todaySessions.length || 1)) * 360}deg, var(--bg-primary) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
               {Math.round((completedCount / (todaySessions.length || 1)) * 100)}%
             </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {todaySessions.length === 0 ? (
          <div className="claude-card" style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ color: "var(--text-muted)" }}>Relax! No sessions scheduled for today.</p>
          </div>
        ) : (
          todaySessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onComplete={(id) => handleStatusUpdate(id, "completed")}
              onPartial={(id, mins) => handleStatusUpdate(id, "partial", mins)}
              onSkip={(id) => handleStatusUpdate(id, "skipped")}
              loading={updatingSession === session.id || isRescheduling}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button onClick={() => router.push("/timeline")} className="claude-button" style={{ minWidth: "200px" }}>
          Explore Full Timeline
        </button>
      </div>
    </div>
  );
}
