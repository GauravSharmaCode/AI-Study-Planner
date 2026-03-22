"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { parseResponseBody, saveToken } from "../../lib/api";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data: any = await parseResponseBody(res);
      if (res.ok && data?.token) {
        saveToken(data.token);
        router.push("/wizard/step1");
      } else {
        setError((data as any)?.message ?? "Registration failed. Please check your details.");
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
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Get Started</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Create your study account</p>
        </div>

        <form onSubmit={onSubmit}>
          {error && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--status-error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "20px", fontSize: "0.875rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: "20px" }}>
            <label className="claude-label">Full Name</label>
            <input
              type="text"
              className="claude-input"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

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
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <button 
              onClick={() => router.push("/auth/login")}
              style={{ color: "var(--accent-color)", fontWeight: 600, border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: "inherit" }}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
