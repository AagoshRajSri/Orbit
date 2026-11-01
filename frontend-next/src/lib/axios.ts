"use client";

/**
 * axios.ts
 *
 * Axios instance for Client Component use.
 * Ported from the Vite frontend with Next.js-compatible adjustments:
 *  - No import.meta.env (use process.env with NEXT_PUBLIC_ prefix)
 *  - Zustand auth store imported lazily inside interceptors (not at top level)
 *    to avoid SSR module resolution issues.
 */

import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
};

// ── Request interceptor: attach auth token + CSRF ─────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  // Lazy import Zustand store to prevent SSR crash
  try {
    const { useAuthStore } = await import("@/store/useAuthStore");
    const token = useAuthStore.getState().socketToken;
    if (token) config.headers["X-Auth-Token"] = token;
  } catch {/* non-critical */}

  // Attach CSRF for state-mutating requests
  const method = config.method?.toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method ?? "")) {
    const csrf = getCookie("csrf_token");
    if (csrf) config.headers["x-csrf-token"] = csrf;
  }

  return config;
});

// ── Response interceptor: silent 401 refresh ──────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  _refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  _refreshQueue = [];
};

const AUTH_ENDPOINTS = ["/auth/refresh", "/auth/login", "/auth/signup", "/auth/logout"];

axiosInstance.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (
      error.response?.status === 401 &&
      !orig._retry &&
      !AUTH_ENDPOINTS.some((u) => orig.url?.includes(u))
    ) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => _refreshQueue.push({ resolve, reject }))
          .then((token) => {
            orig.headers["X-Auth-Token"] = token;
            orig._retry = true;
            return axiosInstance(orig);
          });
      }
      orig._retry = true;
      _isRefreshing = true;
      try {
        const { useAuthStore } = await import("@/store/useAuthStore");
        const { sessionId } = useAuthStore.getState();
        const res = await axiosInstance.post("/auth/refresh", { sessionId }, { withCredentials: true });
        const newToken = res.data.authToken ?? res.data.data?.authToken;
        if (newToken) {
          useAuthStore.setState({ socketToken: newToken });
          axiosInstance.defaults.headers.common["X-Auth-Token"] = newToken;
          orig.headers["X-Auth-Token"] = newToken;
        }
        _isRefreshing = false;
        processQueue(null, newToken);
        return axiosInstance(orig);
      } catch (err) {
        _isRefreshing = false;
        processQueue(err);
        const { useAuthStore } = await import("@/store/useAuthStore").catch(() => ({ useAuthStore: null }));
        useAuthStore?.setState({ authUser: null, sessionId: null, socketToken: null });
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
