"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { apiGetJson } from "../../lib/api";
import { useEffect, useState } from "react";

import { Suspense } from 'react';

function WizardStep3Content() {
  const q = useSearchParams();
  const planId = q.get("planId") || "";
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!planId);

  useEffect(() => {
    if (!planId) return;
    let mounted = true;
    setLoading(true);
    apiGetJson(`/api/v1/plans/${planId}`)
      .then(({ ok, data }: any) => {
        if (mounted) {
          if (ok) {
            const payload = (data?.data ?? data) as any;
            setPlan(payload);
          }
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [planId]);
  return (
    <>
      <h2>Step 3: Plan Generated</h2>
      {planId ? (
        <>
          {loading ? (
            <p>Loading plan...</p>
          ) : (
            <>
              <p>Plan ID: {planId}</p>
              {plan && (
                <div>
                  <h3>Plan Summary</h3>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(plan, null, 2)}
                  </pre>
                </div>
              )}
              <button
                onClick={() => router.push(`/wizard/step4?planId=${planId}`)}
              >
                Continue to Step 4
              </button>
            </>
          )}
        </>
      ) : (
        <p>No plan ID found. Please retry generation.</p>
      )}
    </>
  );
}

export default function WizardStep3() {
  return (
    <div style={{ padding: "24px" }}>
      <Suspense fallback={<p>Loading...</p>}>
        <WizardStep3Content />
      </Suspense>
    </div>
  );
}
