"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetJson, apiPutJson } from "../../lib/api";

type Topic = {
  id?: string;
  subject: string;
  name: string;
  difficulty: number;
  estimatedMinutes: number;
};

import { Suspense } from 'react';

function WizardStep4Content() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId") ?? "";
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
              estimatedMinutes: Number(p.estimatedMinutes) || 30,
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
    const payload = { topics };
    const { ok, data } = await apiPutJson(`/api/v1/plans/${planId}`, payload);
    if (ok) setSaved(true);
    else setSaved(false);
  };

  const content = loading ? (
    <p>Loading topics...</p>
  ) : topics.length ? (
    <div>
      {topics.map((t, i) => (
        <div
          key={i}
          style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}
        >
          <div>Subject: {t.subject}</div>
          <div>Name: {t.name}</div>
          <div>
            <label>Difficulty: </label>
            <input
              type="range"
              min={1}
              max={5}
              value={t.difficulty}
              onChange={(e: any) =>
                onChange(i, "difficulty", Number((e as any).target.value))
              }
            />
            <span style={{ marginLeft: 8 }}>{t.difficulty}</span>
          </div>
          <div>
            <label>Estimated Minutes: </label>
            <input
              type="number"
              min={5}
              max={240}
              value={t.estimatedMinutes}
              onChange={(e: any) =>
                onChange(i, "estimatedMinutes", Number((e as any).target.value))
              }
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p>No topics available yet.</p>
  );

  return (
    <>
      <h2>Step 4: AI-Generated Topics</h2>
      {content}
      <button onClick={onSave} style={{ marginTop: 12 }} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
      {saved && <span style={{ marginLeft: 12, color: "green" }}>Saved</span>}
      <div style={{ marginTop: 12 }}>
        <button onClick={() => router.push("/wizard/step5")}>
          Continue to Step 5
        </button>
      </div>
    </>
  );
}

export default function WizardStep4() {
  return (
    <div style={{ padding: 24 }}>
      <Suspense fallback={<p>Loading...</p>}>
        <WizardStep4Content />
      </Suspense>
    </div>
  );
}
