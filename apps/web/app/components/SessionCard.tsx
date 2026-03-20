"use client";
import { useState } from "react";

interface Session {
  id: string;
  topic: string;
  subject?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  isRevision: boolean;
  status: "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#22c55e";
      case "PARTIAL":
        return "#f59e0b";
      case "SKIPPED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        backgroundColor: session.status === "COMPLETED" ? "#f0fdf4" : "#fff",
        opacity: session.status === "SKIPPED" ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>{session.topic}</span>
            {session.isRevision && (
              <span
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0369a1",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                Revision
              </span>
            )}
          </div>
          {session.subject && (
            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                backgroundColor: "#f3f4f6",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#4b5563",
              }}
            >
              {session.subject}
            </span>
          )}
          <div style={{ marginTop: "8px", color: "#6b7280", fontSize: "14px" }}>
            {formatTime(session.startTime)} - {formatTime(session.endTime)} ({session.plannedMinutes} min)
          </div>
        </div>
        <span
          style={{
            backgroundColor: getStatusColor(session.status),
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {session.status}
        </span>
      </div>

      {session.status === "PENDING" && (
        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          <button
            onClick={() => onComplete(session.id)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Complete
          </button>
          <button
            onClick={() => setShowPartial(!showPartial)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Partial
          </button>
          <button
            onClick={() => onSkip(session.id)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Skip
          </button>
        </div>
      )}

      {showPartial && (
        <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="number"
            value={partialMinutes}
            onChange={(e: any) => setPartialMinutes(e.target.value)}
            placeholder="Minutes"
            min="1"
            max={session.plannedMinutes - 1}
            style={{
              padding: "6px 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              width: "80px",
            }}
          />
          <button
            onClick={handlePartial}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowPartial(false);
              setPartialMinutes("");
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {session.status === "PARTIAL" && session.completedMinutes && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#f59e0b" }}>
          Completed: {session.completedMinutes} minutes
        </div>
      )}

      {session.remarks && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
          Note: {session.remarks}
        </div>
      )}
    </div>
  );
}