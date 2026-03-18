"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WizardStep1() {
  const router = useRouter();
  // Simple auth guard: redirect to login if no token
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
    // Persist locally for Step 2 to consume
    const payload = { examName, targetDate };
    localStorage.setItem("wizard.step1", JSON.stringify(payload));
    router.push("/wizard/step2");
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2>Step 1: Exam Details</h2>
      <div>
        <label>Exam Name</label>
        <input
          aria-label="Exam Name"
          value={examName}
          onChange={(e: any) => setExamName(e.target.value)}
          placeholder="e.g. Finals 2026"
          style={{ display: "block", width: "320px", marginTop: 8 }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Target Completion Date</label>
        <input
          aria-label="Target Date"
          type="date"
          value={targetDate}
          onChange={(e: any) => setTargetDate(e.target.value)}
          style={{ display: "block", width: "320px", marginTop: 8 }}
        />
      </div>
      <button onClick={onNext} style={{ marginTop: 16 }}>
        Next
      </button>
    </div>
  );
}
