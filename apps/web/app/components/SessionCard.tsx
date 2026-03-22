"use client";
import { useState } from "react";
import { formatTime } from "../lib/dateUtils";

interface Session {
  id: string;
  topic: string;
  subject?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  isRevision: boolean;
  status: "pending" | "completed" | "partial" | "skipped";
  completedMinutes?: number;
  remarks?: string;
}

interface SessionCardProps {
  session: Session;
  onComplete: (id: string) => void;
  onPartial: (id: string, minutes: number) => void;
  onSkip: (id: string) => void;
  loading?: boolean;
}

export default function SessionCard({
  session,
  onComplete,
  onPartial,
  onSkip,
  loading,
}: SessionCardProps) {
  const [showPartial, setShowPartial] = useState(false);
  const [partialMinutes, setPartialMinutes] = useState("");

  const handlePartial = () => {
    const mins = parseInt(partialMinutes, 10);
    if (mins > 0 && mins < session.plannedMinutes) {
      onPartial(session.id, mins);
      setShowPartial(false);
      setPartialMinutes("");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return { backgroundColor: "rgba(34, 197, 94, 0.1)", color: "var(--status-success)" };
      case "partial":
        return { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "var(--status-warning)" };
      case "skipped":
        return { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--status-error)" };
      default:
        return { backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" };
    }
  };

  const normalizedStatus = session.status.toLowerCase() as Session["status"];
  const statusStyle = getStatusStyle(normalizedStatus);

  return (
    <div
      className="claude-card"
      style={{
        marginBottom: "12px",
        opacity: session.status === "skipped" ? 0.6 : 1,
        borderLeft: session.status === "completed" ? "4px solid var(--status-success)" : "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{session.topic}</h3>
            {session.isRevision && (
              <span className="claude-badge" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-color)" }}>
                Revision
              </span>
            )}
          </div>
          {session.subject && (
            <span
              className="claude-badge"
              style={{
                marginTop: "6px",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-secondary)",
                borderRadius: "4px",
              }}
            >
              {session.subject}
            </span>
          )}
          <div style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>🕒</span>
            {formatTime(session.startTime)} - {formatTime(session.endTime)} ({session.plannedMinutes} min)
          </div>
        </div>
        <span
          className="claude-badge"
          style={{
            ...statusStyle,
            padding: "4px 10px",
            textTransform: "capitalize",
            fontWeight: 600,
          }}
        >
          {normalizedStatus}
        </span>
      </div>

      {normalizedStatus === "pending" && (
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "10px" }}>
          <button
            className="claude-button"
            onClick={() => onComplete(session.id)}
            disabled={loading}
            style={{ borderColor: "var(--status-success)", color: "var(--status-success)" }}
          >
            Complete
          </button>
          <button
            className="claude-button"
            onClick={() => setShowPartial(!showPartial)}
            disabled={loading}
            style={{ borderColor: "var(--status-warning)", color: "var(--status-warning)" }}
          >
            Partial
          </button>
          <button
            className="claude-button"
            onClick={() => onSkip(session.id)}
            disabled={loading}
            style={{ borderColor: "var(--status-error)", color: "var(--status-error)" }}
          >
            Skip
          </button>
        </div>
      )}

      {showPartial && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
          <input
            type="number"
            className="claude-input"
            value={partialMinutes}
            onChange={(e: any) => setPartialMinutes(e.target.value)}
            placeholder="Mins"
            min="1"
            max={session.plannedMinutes - 1}
            style={{ width: "80px" }}
          />
          <button className="claude-button claude-button-primary" onClick={handlePartial}>
            Save
          </button>
          <button
            className="claude-button"
            onClick={() => {
              setShowPartial(false);
              setPartialMinutes("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {normalizedStatus === "partial" && session.completedMinutes && (
        <div style={{ marginTop: "12px", fontSize: "0.875rem", color: "var(--status-warning)", fontWeight: 500 }}>
          ✓ Completed {session.completedMinutes} minutes
        </div>
      )}

      {session.remarks && (
        <div style={{ marginTop: "12px", fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
          Note: {session.remarks}
        </div>
      )}
    </div>
  );
}
