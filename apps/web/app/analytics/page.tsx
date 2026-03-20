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
        const { ok: statOk, data: statData } = await apiGetJson(`/api/v1/plans/${activePlan.planId}/analytics`);
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
    return <div style={{ padding: "24px", textAlign: "center" }}>Loading analytics...</div>;
  }

  if (!plan || !analytics) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>No active study plan found or no analytics available.</p>
        <button
          onClick={() => router.push("/dashboard")}
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
          Back to Dashboard
        </button>
      </div>
    );
  }

  const formatHours = (mins: number) => (mins / 60).toFixed(1) + "h";

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

      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Analytics & Progress</h1>
      {plan.examName && <p style={{ color: "#6b7280", marginBottom: "24px" }}>{plan.examName}</p>}

      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {analytics.isAtRisk && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "16px", borderRadius: "8px", border: "1px solid #fca5a5", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong>Schedule at Risk</strong>
            <p style={{ margin: 0, fontSize: "14px", marginTop: "4px" }}>
              You are falling behind the required velocity to finish by your exam date. Consider increasing your daily study hours.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        <div style={{ backgroundColor: "#f9fafb", padding: "24px", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "24px", color: "#374151" }}>Overall Coverage</h3>
          <AnalyticsChart
            percentage={analytics.completionPercentage}
            color={analytics.completionPercentage > 75 ? "#22c55e" : analytics.completionPercentage > 40 ? "#eab308" : "#3b82f6"}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Time Invested</div>
            <div style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>
              {formatHours(analytics.totalCompletedMinutes)} <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "normal" }}>/ {formatHours(analytics.totalPlannedMinutes)}</span>
            </div>
          </div>
          
          <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Days Remaining</div>
            <div style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px", color: analytics.daysRemaining < 7 ? "#dc2626" : "inherit" }}>
              {analytics.daysRemaining} days
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Sessions Overview</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px" }}>
        <div style={{ border: "1px solid #e5e7eb", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 600 }}>{analytics.totalSessions}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textTransform: "uppercase" }}>Total</div>
        </div>
        <div style={{ border: "1px solid #bbf7d0", backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "#166534" }}>{analytics.completedSessions}</div>
          <div style={{ fontSize: "12px", color: "#166534", marginTop: "4px", textTransform: "uppercase" }}>Completed</div>
        </div>
        <div style={{ border: "1px solid #fef08a", backgroundColor: "#fefce8", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "#854d0e" }}>{analytics.partialSessions}</div>
          <div style={{ fontSize: "12px", color: "#854d0e", marginTop: "4px", textTransform: "uppercase" }}>Partial</div>
        </div>
        <div style={{ border: "1px solid #fecaca", backgroundColor: "#fef2f2", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "#991b1b" }}>{analytics.skippedSessions}</div>
          <div style={{ fontSize: "12px", color: "#991b1b", marginTop: "4px", textTransform: "uppercase" }}>Skipped</div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: 600 }}>{analytics.pendingSessions}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textTransform: "uppercase" }}>Pending</div>
        </div>
      </div>
    </div>
  );
}