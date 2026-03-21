"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetJson } from "../../lib/api";

function WizardStep3Content() {
  const q = useSearchParams();
  const planId = q.get("planId") || "";
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!planId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    let mounted = true;
    setLoading(true);
    apiGetJson(`/api/v1/plans/${planId}`)
      .then(({ ok, data }: any) => {
        if (mounted) {
          if (ok) {
            setPlan((data?.data ?? data) as any);
          } else {
            setError(data?.message ?? "Could not retrieve plan details.");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Network error occurred.");
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [planId]);

  if (!planId) {
    return (
      <div className="claude-card" style={{ textAlign: "center", padding: "40px" }}>
        <h2 style={{ color: "var(--status-error)", marginBottom: "16px" }}>Missing Plan ID</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>Something went wrong during generation. Please try again.</p>
        <button onClick={() => router.push("/wizard/step2")} className="claude-button claude-button-primary">
          Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="claude-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="claude-card" style={{ width: "100%", maxWidth: "600px", padding: "40px" }}>
        <div style={{ marginBottom: "32px" }}>
          <div className="claude-badge" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-color)", marginBottom: "16px" }}>Step 3 of 5</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Plan Concept</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Our AI has drafted your path forward.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto 16px" }}></div>
            <p style={{ color: "var(--text-secondary)" }}>Fetching draft details...</p>
          </div>
        ) : error ? (
           <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
             {error}
           </div>
        ) : (
          <>
            <div className="claude-card" style={{ backgroundColor: "var(--bg-primary)", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Draft Summary</h3>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                 <div><span style={{ fontWeight: 600 }}>Subjects:</span> {plan?.subjects?.join(", ") || "None listed"}</div>
                 <div><span style={{ fontWeight: 600 }}>Daily Hours:</span> {plan?.availableHoursPerDay || 4}h</div>
                 <div><span style={{ fontWeight: 600 }}>Exam:</span> {plan?.examName || "Standard Exam"}</div>
                 <div><span style={{ fontWeight: 600 }}>Target Date:</span> {plan?.targetCompletionDate || "Not set"}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => router.back()} className="claude-button">
                Change Details
              </button>
              <button 
                onClick={() => router.push(`/wizard/step4?planId=${planId}`)} 
                className="claude-button claude-button-primary"
                style={{ minWidth: "160px" }}
              >
                Review Modules →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function WizardStep3() {
  return (
    <div className="claude-container">
      <Suspense fallback={
        <div style={{ textAlign: "center", paddingTop: "60px" }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto" }}></div>
        </div>
      }>
        <WizardStep3Content />
      </Suspense>
    </div>
  );
}
