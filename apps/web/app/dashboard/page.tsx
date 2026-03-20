"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionCard from "../components/SessionCard";
import { apiGetJson, apiPatchJson } from "../lib/api";
import { useRescheduleStatus } from "../hooks/useRescheduleStatus";

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
        setError(data.message || "Failed to fetch plans");
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
    const today = new Date().toISOString().split("T")[0] || "";
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
        if (status === "PARTIAL" || status === "SKIPPED") {
          // Trigger the polling hook for async rebalancing
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
  const completedCount = todaySessions.filter((s) => s.status === "COMPLETED").length;

  if (loading && !plan) {
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Today&apos;s Study Plan</h1>
        <button
          onClick={() => router.push("/analytics")}
          style={{ padding: "6px 12px", backgroundColor: "#f3f4f6", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}
        >
          View Analytics
        </button>
      </div>
      
      {plan.examName && (
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>{plan.examName}</p>
      )}

      {isRescheduling && (
        <div style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "12px", borderRadius: "8px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "16px", height: "16px", border: "2px solid #93c5fd", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <span style={{ fontWeight: 500 }}>AI is rebalancing your schedule in the background...</span>
        </div>
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
            loading={updatingSession === session.id || isRescheduling}
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