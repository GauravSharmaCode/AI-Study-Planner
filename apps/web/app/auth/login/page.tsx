"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: any = await res.json();
      if (res.ok && data?.data?.token) {
        saveToken(data.data.token);
        router.push("/wizard/step1");
      } else {
        setError((data as any)?.message ?? "Login failed");
      }
    } catch {
      setError("Network error");
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ padding: 16 }}>
      <h2>Login</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" style={{ marginTop: 8 }}>
        Login
      </button>
    </form>
  );
}
