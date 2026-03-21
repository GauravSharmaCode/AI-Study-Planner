"use client";
import React from "react";
import Link from "next/link";

export default function WizardDone() {
  return (
    <div className="claude-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="claude-card" style={{ width: "100%", maxWidth: "480px", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>🎉</div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "12px", fontFamily: "var(--font-serif)" }}>Success!</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: "1.6", marginBottom: "40px" }}>
          Your study plan has been generated and activated. You&apos;re now ready to begin your journey toward mastering your subjects.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/dashboard" className="claude-button claude-button-primary" style={{ textDecoration: "none", padding: "14px" }}>
            Go to My Dashboard
          </button>
          <Link href="/timeline" className="claude-button" style={{ textDecoration: "none" }}>
            View Full Timeline
          </Link>
        </div>

        <p style={{ marginTop: "32px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          You can always adjust your plan later from the settings.
        </p>
      </div>
    </div>
  );
}
