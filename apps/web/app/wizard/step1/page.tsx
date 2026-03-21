"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WizardStep1() {
  const router = useRouter();
  
  useEffect(() => {
    let token: string | null = null;
    try {
      token = (globalThis as any).localStorage?.getItem("auth_token") ?? null;
    } catch {
      token = null;
    }
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  const [examName, setExamName] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const onNext = () => {
    if (!examName || !targetDate) return;
    const payload = { examName, targetDate };
    localStorage.setItem("wizard.step1", JSON.stringify(payload));
    router.push("/wizard/step2");
  };

  return (
    <div className="claude-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="claude-card" style={{ width: "100%", maxWidth: "480px", padding: "40px" }}>
        <div style={{ marginBottom: "32px" }}>
          <div className="claude-badge" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-color)", marginBottom: "16px" }}>Step 1 of 5</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Exam Details</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Tell us what you&apos;re preparing for.</p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label className="claude-label">Exam Name</label>
          <input
            className="claude-input"
            value={examName}
            onChange={(e: any) => setExamName(e.target.value)}
            placeholder="e.g. CFA Level 1, UPSC, Finals"
            required
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label className="claude-label">Target Completion Date</label>
          <input
            className="claude-input"
            type="date"
            value={targetDate}
            onChange={(e: any) => setTargetDate(e.target.value)}
            required
          />
          <p style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>We&apos;ll build your schedule backwards from this date.</p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={onNext} 
            className="claude-button claude-button-primary" 
            style={{ width: "120px" }}
            disabled={!examName || !targetDate}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
