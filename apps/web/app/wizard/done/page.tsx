"use client";
import React from "react";
import Link from "next/link";

export default function WizardDone() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Plan Finalized</h2>
      <p>
        Your onboarding plan is finalized. You can view analytics or start
        reviewing results.
      </p>
      <Link href="/">Go to Home</Link>
    </div>
  );
}
