"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: any = await res.json();
      if (res.ok && data?.token) {
        saveToken(data.token);
        router.push("/wizard/step1");
      } else {
        setError((data as any)?.message ?? "Login failed. Please check your credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claude-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="claude-card" style={{ width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Log in to your study dashboard</p>
        </div>

        <form onSubmit={onSubmit}>
          {error && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "20px", fontSize: "0.875rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: "20px" }}>
            <label className="claude-label">Email Address</label>
            <input
              type="email"
              className="claude-input"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <label className="claude-label">Password</label>
            <input
              type="password"
              className="claude-input"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="claude-button claude-button-primary" style={{ width: "100%", padding: "12px" }} disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <button 
              onClick={() => router.push("/auth/register")}
              style={{ color: "var(--accent-color)", fontWeight: 600, border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: "inherit" }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
