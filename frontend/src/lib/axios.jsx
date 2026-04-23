import axios from "axios";
import { API_URL } from "../config.js";
import { useAuthStore } from "../store/useAuthStore";

export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  try {
    const authData = JSON.parse(localStorage.getItem("orbit-auth-storage") || "{}");
    const token = authData.state?.socketToken;
    if (token && !config.headers["X-Auth-Token"]) {
      config.headers["X-Auth-Token"] = token;
    }
  } catch (e) {}
  return config;
});

// ── Response interceptor: silently refresh on 401 ──
let _isRefreshing = false;
let _refreshQueue = [];

const processQueue = (error, token = null) => {
  _refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  _refreshQueue = [];
};

const AUTH_ENDPOINTS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/signup",
  "/auth/check",
  "/auth/logout",
  "/starweave/login",
  "/starweave/enroll"
];

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not an auth route we should ignore
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !AUTH_ENDPOINTS.some((url) => originalRequest.url.includes(url))
    ) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const authState = useAuthStore.getState();
        await axios.post(
          `${API_URL}/api/auth/refresh`,
          { sessionId: authState.sessionId },
          { withCredentials: true }
        );

        _isRefreshing = false;
        
        // Background refresh socket token to keep it in sync
        authState.refreshSocketToken().catch(console.error);

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        _isRefreshing = false;
        processQueue(refreshError);
        
        // Wipe local session on refresh failure
        useAuthStore.setState({ authUser: null, sessionId: null, socketToken: null });
        localStorage.removeItem("orbit-auth-storage");
        
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
