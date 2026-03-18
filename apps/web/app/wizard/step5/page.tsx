"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetJson, apiPutJson } from "../../lib/api";

import { Suspense } from 'react';

function WizardStep5Content() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId") ?? "";
  const onFinalize = async () => {
    if (!planId) return;
    // Finalize by re-submitting the current plan fields (valid fields only)
    const getResp: any = await apiGetJson(`/api/v1/plans/${planId}`);
    if (!getResp.ok) return;
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
    }
  };

  return (
    <>
      <h2>Step 5: Review & Finalize</h2>
      <p>This is a placeholder for final review and plan finalization.</p>
      <button onClick={onFinalize}>Finalize Plan</button>
    </>
  );
}

export default function WizardStep5() {
  return (
    <div style={{ padding: 24 }}>
      <Suspense fallback={<p>Loading...</p>}>
        <WizardStep5Content />
      </Suspense>
    </div>
  );
}
