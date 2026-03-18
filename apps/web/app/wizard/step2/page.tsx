"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPostJson } from "../../lib/api";

type Step1Data = { examName: string; targetDate: string };

export default function WizardStep2() {
  const router = useRouter();
  const [step1, setStep1] = useState<Step1Data | null>(null);
  const [rawSubjects, setRawSubjects] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("wizard.step1");
    if (s) {
      setStep1(JSON.parse(s));
    }
  }, []);

  const onNext = async () => {
    const subjects = rawSubjects
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (!step1 || subjects.length === 0) {
      setError("Please provide at least one subject and complete Step 1");
      return;
    }

    const payload = {
      subjects,
      availableHoursPerDay: 4,
      targetCompletionDate: step1.targetDate,
      examName: step1.examName,
      preferredStartTime: "08:00",
    };

    try {
      setLoading(true);
      const { ok, data } = await apiPostJson("/api/v1/plans/generate", payload);
      if (ok && (data as any)?.data?.planId) {
        // navigate to step3 with planId
        router.push(`/wizard/step3?planId=${(data as any).data.planId}`);
      } else {
        setError((data as any)?.message ?? "Generation failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2>Step 2: Subjects</h2>
      <div>
        <label>Subjects (comma-separated)</label>
        <input
          aria-label="Subjects"
          placeholder="e.g. Mathematics, Physics, Chemistry"
          value={rawSubjects}
          onChange={(e: any) => setRawSubjects(e.target.value)}
          style={{ display: "block", width: "520px", marginTop: 8 }}
        />
      </div>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      <button onClick={onNext} style={{ marginTop: 16 }} disabled={loading}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>
    </div>
  );
}
