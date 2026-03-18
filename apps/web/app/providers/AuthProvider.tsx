"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    let t: string | null = null;
    try {
      const globalLs: any = (globalThis as any).localStorage;
      if (globalLs && typeof globalLs.getItem === "function") {
        t = globalLs.getItem("auth_token");
      }
    } catch {
      t = null;
    }
    if (t) setToken(t);
  }, []);

  const login = (t: string) => {
    setToken(t);
    try {
      const globalLs: any = (globalThis as any).localStorage;
      if (globalLs && typeof globalLs.setItem === "function")
        globalLs.setItem("auth_token", t);
    } catch {}
  };

  const logout = () => {
    setToken(null);
    try {
      const globalLs: any = (globalThis as any).localStorage;
      if (globalLs && typeof globalLs.removeItem === "function")
        globalLs.removeItem("auth_token");
    } catch {}
  };

  const value = {
    token,
    login,
    logout,
    isAuthenticated: Boolean(token),
  } as AuthContextType;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
