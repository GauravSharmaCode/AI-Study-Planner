"use client";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetJson, apiPutJson } from "../../lib/api";

function WizardStep5Content() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId") ?? "";
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinalize = async () => {
    if (!planId) return;
    try {
      setFinalizing(true);
      setError(null);
      // Finalize by re-submitting the current plan fields to ensure it's marked as complete/active
      const getResp: any = await apiGetJson(`/api/v1/plans/${planId}`);
      if (!getResp.ok) {
        setError("Could not retrieve plan for finalization.");
        return;
      }
      const planSrc = (getResp.data?.data ?? getResp.data) as any;
      const payload: any = {
        examName: planSrc?.examName,
        subjects: planSrc?.subjects,
        availableHoursPerDay: planSrc?.availableHoursPerDay,
        preferredStartTime: planSrc?.preferredStartTime,
        targetCompletionDate: planSrc?.targetCompletionDate,
      };
      
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined),
      ) as any;
      
      const putResp = await apiPutJson(`/api/v1/plans/${planId}`, cleanPayload);
      if (putResp.ok) {
        router.push("/wizard/done");
      } else {
        setError("Finalization failed. Please try again.");
      }
    } catch {
      setError("Network error occurred.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="claude-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="claude-card" style={{ width: "100%", maxWidth: "520px", padding: "40px", textAlign: "center" }}>
        <div style={{ marginBottom: "32px" }}>
          <div className="claude-badge" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-color)", marginBottom: "16px" }}>Step 5 of 5</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>All Set</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Ready to transform your study routine?</p>
        </div>

        <div className="claude-card" style={{ backgroundColor: "var(--bg-primary)", marginBottom: "32px", textAlign: "left" }}>
           <h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>What happens next?</h3>
           <ul style={{ fontSize: "0.875rem", color: "var(--text-secondary)", paddingLeft: "20px", lineHeight: "1.6" }}>
             <li>We&apos;ll build your personalized daily schedule.</li>
             <li>Sessions are intelligently spaced for maximum retention.</li>
             <li>Miss a session? Our AI will rebalance your plan automatically.</li>
           </ul>
        </div>

        {error && (
          <div style={{ marginBottom: "20px", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={() => router.back()} className="claude-button" disabled={finalizing}>
            Review Topics
          </button>
          <button 
            onClick={onFinalize} 
            className="claude-button claude-button-primary" 
            style={{ minWidth: "180px" }}
            disabled={finalizing}
          >
            {finalizing ? "Finalizing Plan..." : "Launch My Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WizardStep5() {
  return (
    <Suspense fallback={<div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
      <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto" }}></div>
    </div>}>
      <WizardStep5Content />
    </Suspense>
  );
}
