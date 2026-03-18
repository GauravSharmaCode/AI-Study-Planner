// Lightweight frontend API client (no external deps) with token stored in localStorage

export async function apiFetch(input: any, init: any = {}) {
  const ls = (globalThis as any).localStorage;
  const token = ls ? ls.getItem("auth_token") : null;
  const headers = init.headers ? { ...init.headers } : {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const merged = { ...init, headers };
  return fetch(input, merged);
}

export async function apiPostJson<T = any>(url: string, body: any) {
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function apiPutJson<T = any>(url: string, body: any) {
  const res = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function apiGetJson<T = any>(url: string) {
  const res = await apiFetch(url, { method: "GET" });
  const data = await res.json();
  return { ok: res.ok, data };
}

export function saveToken(token: string) {
  const ls = (globalThis as any).localStorage;
  if (ls) ls.setItem("auth_token", token);
}

export function clearToken() {
  const ls = (globalThis as any).localStorage;
  if (ls) ls.removeItem("auth_token");
}
