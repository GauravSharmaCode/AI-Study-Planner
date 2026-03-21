"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetJson, apiPutJson } from "../../lib/api";

type Topic = {
  id?: string;
  subject: string;
  name: string;
  difficulty: number;
  estimatedMinutes: number;
};

function WizardStep4Content() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId") ?? "";
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    apiGetJson(`/api/v1/plans/${planId}`)
      .then(({ ok, data }: any) => {
        if (ok) {
          const plan = (data?.data ?? data) as any;
          const tps: Topic[] = (plan?.topics ?? plan?.sessions ?? []).map(
            (p: any) => ({
              id: p.id,
              subject: p.subject ?? "",
              name: p.name ?? p.topic ?? "",
              difficulty: Number(p.difficulty) || 3,
              estimatedMinutes: Number(p.estimatedMinutes) || 60,
            }),
          );
          setTopics(tps.length ? tps : []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planId]);

  const onChange = (idx: number, key: keyof Topic, value: any) => {
    setTopics((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    );
  };

  const onSave = async () => {
    if (!planId) return;
    try {
      setSaving(true);
      const payload = { topics };
      const { ok } = await apiPutJson(`/api/v1/plans/${planId}`, payload);
      if (ok) {
        router.push(`/wizard/step5?planId=${planId}`);
      } else {
        setError("Failed to save changes. Please try again.");
      }
    } catch {
       setError("Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="claude-container" style={{ paddingBottom: "100px" }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div className="claude-badge" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-color)", marginBottom: "16px" }}>Step 4 of 5</div>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Study Modules</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Review and adjust the difficulty or duration for each topic.</p>
      </div>

      {loading ? (
         <div style={{ textAlign: "center", padding: "40px 0" }}>
           <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto" }}></div>
         </div>
      ) : topics.length === 0 ? (
         <div className="claude-card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-muted)" }}>No topics generated. This is unexpected.</p>
            <button onClick={() => router.back()} className="claude-button" style={{ marginTop: "16px" }}>Go Back</button>
         </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {topics.map((t, i) => (
            <div key={i} className="claude-card" style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span className="claude-label" style={{ marginBottom: "4px", fontSize: "0.75rem" }}>{t.subject}</span>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
              </div>
              
              <div style={{ flex: "1 1 180px" }}>
                <label className="claude-label" style={{ fontSize: "0.75rem" }}>Difficulty: {t.difficulty}</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={t.difficulty}
                  onChange={(e: any) => onChange(i, "difficulty", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-color)", cursor: "pointer" }}
                />
              </div>

              <div style={{ flex: "0 0 120px" }}>
                <label className="claude-label" style={{ fontSize: "0.75rem" }}>Duration (min)</label>
                <input
                  type="number"
                  className="claude-input"
                  min={5}
                  max={240}
                  step={5}
                  value={t.estimatedMinutes}
                  onChange={(e: any) => onChange(i, "estimatedMinutes", Number(e.target.value))}
                  style={{ padding: "4px 8px" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: "24px", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {error}
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", padding: "20px 0", zIndex: 10 }}>
        <div className="claude-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px" }}>
          <button onClick={() => router.back()} className="claude-button">
            Back
          </button>
          <button 
            onClick={onSave} 
            className="claude-button claude-button-primary" 
            style={{ minWidth: "160px" }}
            disabled={saving || loading}
          >
            {saving ? "Saving Details..." : "Finalize Topics"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WizardStep4() {
  return (
    <Suspense fallback={<div className="claude-container" style={{ textAlign: "center", paddingTop: "60px" }}>
      <div className="animate-spin" style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto" }}></div>
    </div>}>
      <WizardStep4Content />
    </Suspense>
  );
}
