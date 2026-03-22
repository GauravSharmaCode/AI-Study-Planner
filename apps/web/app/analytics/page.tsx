"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGetJson } from "../lib/api";
import AnalyticsChart from "../components/AnalyticsChart";

interface AnalyticsData {
  totalSessions: number;
  completedSessions: number;
  skippedSessions: number;
  partialSessions: number;
  pendingSessions: number;
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  completionPercentage: number;
  daysRemaining: number;
  remainingWorkloadMinutes: number;
  isAtRisk: boolean;
}

interface Plan {
  planId: string;
  examName?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiGetJson("/api/v1/plans");
      if (!ok) {
        setError(data.message || "Failed to fetch plans");
        return;
      }
      const activePlan = data.data?.find((p: any) => p.isActive);
      if (activePlan) {
        setPlan(activePlan);
        const planId = activePlan.planId ?? activePlan.id;
        const { ok: statOk, data: statData } = await apiGetJson(`/api/v1/plans/${planId}/analytics`);
        if (statOk) {
          setAnalytics(statData.data);
        } else {
          setError("Failed to fetch analytics");
        }
      }
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Analyzing your progress...</p>
      </div>
    );
  }

  if (!plan || !analytics) {
    return (
      <div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <h2 style={{ marginBottom: "16px" }}>No Analytics Yet</h2>
        <button onClick={() => router.push("/dashboard")} className="claude-button claude-button-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const formatHours = (mins: number) => (mins / 60).toFixed(1) + "h";

  return (
    <div className="claude-container">
      <div style={{ marginBottom: "32px" }}>
        <button onClick={() => router.push("/dashboard")} className="claude-button" style={{ border: "none", paddingLeft: 0, marginBottom: "24px" }}>
          ← <span style={{ textDecoration: "underline" }}>Dashboard</span>
        </button>
        <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Analytics</h1>
        {plan.examName && <p style={{ color: "var(--text-secondary)" }}>{plan.examName}</p>}
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "24px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {error}
        </div>
      )}

      {analytics.isAtRisk && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)", marginBottom: "32px", display: "flex", gap: "16px" }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div>
            <strong style={{ fontSize: "1.1rem" }}>Schedule at Risk</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.875rem", opacity: 0.9 }}>
              You are falling behind the required velocity. Consider re-evaluating your daily targets or increasing study hours to stay on track for your exam.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }}>
        <div className="claude-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "240px" }}>
          <h3 className="claude-label" style={{ marginBottom: "24px" }}>Overall Completion</h3>
          <AnalyticsChart
            percentage={analytics.completionPercentage}
            color={analytics.completionPercentage > 75 ? "var(--status-success)" : analytics.completionPercentage > 40 ? "var(--status-warning)" : "var(--accent-color)"}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="claude-card" style={{ flex: 1 }}>
            <div className="claude-label">Time Invested</div>
            <div style={{ fontSize: "2rem", fontWeight: 600, marginTop: "8px" }}>
              {formatHours(analytics.totalCompletedMinutes)} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>/ {formatHours(analytics.totalPlannedMinutes)}</span>
            </div>
            <div style={{ marginTop: "12px", height: "4px", backgroundColor: "var(--bg-primary)", borderRadius: "2px", overflow: "hidden" }}>
               <div style={{ height: "100%", backgroundColor: "var(--accent-color)", width: `${(analytics.totalCompletedMinutes / analytics.totalPlannedMinutes) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="claude-card" style={{ flex: 1 }}>
            <div className="claude-label">Days Remaining</div>
            <div style={{ fontSize: "2rem", fontWeight: 600, marginTop: "8px", color: analytics.daysRemaining < 7 ? "var(--status-error)" : "inherit" }}>
              {analytics.daysRemaining} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>days until exam</span>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "20px", fontFamily: "var(--font-serif)" }}>Detailed Breakdown</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        <div className="claude-card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{analytics.totalSessions}</div>
          <div className="claude-label" style={{ marginTop: "4px", fontSize: "0.75rem" }}>Total Units</div>
        </div>
        <div className="claude-card" style={{ textAlign: "center", padding: "16px", borderBottom: "3px solid var(--status-success)" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--status-success)" }}>{analytics.completedSessions}</div>
          <div className="claude-label" style={{ marginTop: "4px", fontSize: "0.75rem" }}>Success</div>
        </div>
        <div className="claude-card" style={{ textAlign: "center", padding: "16px", borderBottom: "3px solid var(--status-warning)" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--status-warning)" }}>{analytics.partialSessions}</div>
          <div className="claude-label" style={{ marginTop: "4px", fontSize: "0.75rem" }}>Partial</div>
        </div>
        <div className="claude-card" style={{ textAlign: "center", padding: "16px", borderBottom: "3px solid var(--status-error)" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--status-error)" }}>{analytics.skippedSessions}</div>
          <div className="claude-label" style={{ marginTop: "4px", fontSize: "0.75rem" }}>Skipped</div>
        </div>
        <div className="claude-card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text-muted)" }}>{analytics.pendingSessions}</div>
          <div className="claude-label" style={{ marginTop: "4px", fontSize: "0.75rem" }}>Planned</div>
        </div>
      </div>
    </div>
  );
}
