import axios from "axios";
import { API_URL } from "../config.js";
import { useAuthStore } from "../store/useAuthStore";

export const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  try {
    const authState = useAuthStore.getState();
    const token = authState.socketToken;
    if (token && !config.headers["X-Auth-Token"]) {
      config.headers["X-Auth-Token"] = token;
    }
  } catch (e) {
    console.error("Interceptor failed to attach token:", e);
  }
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
        const refreshRes = await axiosInstance.post(
          "/auth/refresh",
          { sessionId: authState.sessionId },
          { withCredentials: true }
        );

        _isRefreshing = false;
        
        const newAuthToken = refreshRes.data.authToken;
        const newSessionId = refreshRes.data.sessionId;

        useAuthStore.setState({
          socketToken: newAuthToken,
          sessionId: newSessionId || authState.sessionId
        });
        
        if (typeof authState.refreshSocketToken === "function") {
          authState.refreshSocketToken().catch(console.error);
        }

        import("./socket.js").then(({ updateSocketToken }) => {
          if (updateSocketToken) updateSocketToken(newAuthToken);
        }).catch(console.error);

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        _isRefreshing = false;
        processQueue(refreshError);
        
        console.warn("[Axios Interceptor] Refresh failed. Wiping session.", refreshError.response?.data || refreshError.message);
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
