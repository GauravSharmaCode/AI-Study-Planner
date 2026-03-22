"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPostJson } from "../../lib/api";

type Step1Data = { examName: string; targetDate: string };

export default function WizardStep2() {
  const router = useRouter();
  const [step1, setStep1] = useState<Step1Data | null>(null);
  const [rawSubjects, setRawSubjects] = useState("");
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(4);
  const [preferredStartTime, setPreferredStartTime] = useState("08:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("wizard.step1");
    if (s) {
      setStep1(JSON.parse(s));
    } else {
      router.push("/wizard/step1");
    }
  }, [router]);

  const onNext = async () => {
    const subjects = rawSubjects
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (!step1 || subjects.length === 0) {
      setError("Please provide at least one subject.");
      return;
    }

    const payload = {
      subjects,
      availableHoursPerDay: Number(availableHoursPerDay),
      targetCompletionDate: step1.targetDate,
      examName: step1.examName,
      preferredStartTime,
    };

    try {
      setLoading(true);
      setError(null);
      const { ok, data } = await apiPostJson("/api/v1/plans/generate", payload);
      if (ok && (data as any)?.data?.planId) {
        router.push(`/wizard/done`);
      } else {
        setError((data as any)?.message ?? "Generation failed. Our AI might be busy, please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claude-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="claude-card" style={{ width: "100%", maxWidth: "520px", padding: "40px" }}>
        <div style={{ marginBottom: "32px" }}>
          <div className="claude-badge" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-color)", marginBottom: "16px" }}>Step 2 of 2</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Subjects</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>What subjects or areas are you covering?</p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label className="claude-label">List Subjects</label>
          <textarea
            className="claude-input"
            placeholder="e.g. Mathematics, Organic Chemistry, Macroeconomics"
            value={rawSubjects}
            onChange={(e: any) => setRawSubjects(e.target.value)}
            style={{ display: "block", width: "100%", minHeight: "100px", resize: "vertical" }}
            required
          />
          <p style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>Separate subjects with commas. Our AI will break these down into study units.</p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label className="claude-label">Available Study Hours per Day</label>
          <input
            type="number"
            className="claude-input"
            min={0.5}
            max={12}
            step={0.5}
            value={availableHoursPerDay}
            onChange={(e: any) => setAvailableHoursPerDay(e.target.value)}
            required
          />
          <p style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>How many hours can you dedicate to studying each day?</p>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label className="claude-label">Preferred Start Time</label>
          <input
            type="time"
            className="claude-input"
            value={preferredStartTime}
            onChange={(e: any) => setPreferredStartTime(e.target.value)}
            required
          />
          <p style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>When do you usually start studying? (e.g. 08:00)</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "20px", fontSize: "0.875rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => router.back()} className="claude-button">
            Back
          </button>
          <button 
            onClick={onNext} 
            className="claude-button claude-button-primary" 
            style={{ minWidth: "160px" }}
            disabled={loading || !rawSubjects.trim()}
          >
            {loading ? (
               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                 <div className="animate-spin" style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }}></div>
                 AI Generating...
               </div>
            ) : "Generate and Launch Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
