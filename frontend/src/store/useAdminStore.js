import { create } from "zustand";
import { axiosInstance } from "../lib/axios.jsx";
import toast from "react-hot-toast";
import { getSocket, reconnectSocket } from "../lib/socket.js";

export const useAdminStore = create((set, get) => ({
  isAdminAuth: false,
  adminToken: null,
  isLoggingIn: false,
  isFetchingData: false,

  stats: null,
  users: [],
  messages: [],
  nexuses: [],
  auditLogs: [],
  systemConfig: null,
  systemTelemetry: [],
  liveEvents: [],
  insights: [],

  pagination: {
    users: { total: 0, page: 1, pages: 1 },
    messages: { total: 0, page: 1, pages: 1 },
    nexuses: { total: 0, page: 1, pages: 1 },
    auditLogs: { total: 0, page: 1, pages: 1 },
  },

  checkAdminAuth: async () => {
    try {
      const res = await axiosInstance.get("/admin/check");
      set({ isAdminAuth: true });
    } catch (error) {
      set({ isAdminAuth: false, adminToken: null });
    }
  },

  login: async (username, password) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/admin/login", { username, password });
      set({ isAdminAuth: true, adminToken: res.data.token });
      reconnectSocket(); // Ensure socket connects as admin
      toast.success("Admin authenticated");
      return true;
    } catch (error) {
      set({ isAdminAuth: false });
      toast.error(error.response?.data?.message || "Admin login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/admin/logout");
      set({ isAdminAuth: false, adminToken: null });
      reconnectSocket(); // Revert socket to user/guest
      toast.success("Admin logged out");
    } catch (error) {
      toast.error("Logout failed");
    }
  },

  fetchStats: async () => {
    try {
      const res = await axiosInstance.get("/admin/dashboard/stats");
      set({ stats: res.data.stats });
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    }
  },

  fetchUsers: async (page = 1, search = "") => {
    set({ isFetchingData: true });
    try {
      const res = await axiosInstance.get(`/admin/users?page=${page}&search=${search}`);
      set((state) => ({
        users: res.data.users,
        pagination: { ...state.pagination, users: res.data.pagination },
      }));
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      set({ isFetchingData: false });
    }
  },

  forceLogoutUser: async (userId) => {
    try {
      await axiosInstance.post(`/admin/users/${userId}/force-logout`);
      toast.success("User force logged out");
    } catch (error) {
      toast.error("Failed to force logout user");
    }
  },

  toggleBanUser: async (userId) => {
    try {
      const res = await axiosInstance.post(`/admin/users/${userId}/toggle-ban`);
      toast.success(res.data.message);
      
      // Update local state
      const { users } = get();
      set({
        users: users.map(u => u._id === userId ? { ...u, isLocked: res.data.user.isLocked } : u)
      });
    } catch (error) {
      toast.error("Failed to toggle user ban");
    }
  },

  deleteUser: async (userId) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      toast.success("User soft-deleted");
      
      const { users } = get();
      set({ users: users.map(u => u._id === userId ? { ...u, isDeleted: true } : u) });
    } catch (error) {
      toast.error("Failed to delete user");
    }
  },

  restoreUser: async (userId) => {
    try {
      const res = await axiosInstance.post(`/admin/users/${userId}/restore`);
      toast.success("User restored");
      
      const { users } = get();
      set({ users: users.map(u => u._id === userId ? { ...u, isDeleted: false } : u) });
    } catch (error) {
      toast.error("Failed to restore user");
    }
  },

  fetchMessages: async (page = 1) => {
    set({ isFetchingData: true });
    try {
      const res = await axiosInstance.get(`/admin/messages?page=${page}`);
      set((state) => ({
        messages: res.data.messages,
        pagination: { ...state.pagination, messages: res.data.pagination },
      }));
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      set({ isFetchingData: false });
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/admin/messages/${messageId}`);
      toast.success("Message soft-deleted");
      
      const { messages } = get();
      set({ messages: messages.map(m => m._id === messageId ? { ...m, isDeleted: true } : m) });
    } catch (error) {
      toast.error("Failed to delete message");
    }
  },

  restoreMessage: async (messageId) => {
    try {
      const res = await axiosInstance.post(`/admin/messages/${messageId}/restore`);
      toast.success("Message restored");
      
      const { messages } = get();
      set({ messages: messages.map(m => m._id === messageId ? { ...m, isDeleted: false } : m) });
    } catch (error) {
      toast.error("Failed to restore message");
    }
  },

  fetchNexuses: async (page = 1) => {
    set({ isFetchingData: true });
    try {
      const res = await axiosInstance.get(`/admin/nexuses?page=${page}`);
      set((state) => ({
        nexuses: res.data.nexuses,
        pagination: { ...state.pagination, nexuses: res.data.pagination },
      }));
    } catch (error) {
      console.error("Failed to fetch nexuses", error);
    } finally {
      set({ isFetchingData: false });
    }
  },

  deleteNexus: async (nexusId) => {
    try {
      await axiosInstance.delete(`/admin/nexuses/${nexusId}`);
      toast.success("Nexus soft-deleted");
      
      const { nexuses } = get();
      set({ nexuses: nexuses.map(n => n._id === nexusId ? { ...n, isDeleted: true } : n) });
    } catch (error) {
      toast.error("Failed to delete nexus");
    }
  },

  restoreNexus: async (nexusId) => {
    try {
      const res = await axiosInstance.post(`/admin/nexuses/${nexusId}/restore`);
      toast.success("Nexus restored");
      
      const { nexuses } = get();
      set({ nexuses: nexuses.map(n => n._id === nexusId ? { ...n, isDeleted: false } : n) });
    } catch (error) {
      toast.error("Failed to restore nexus");
    }
  },

  fetchAuditLogs: async (page = 1) => {
    set({ isFetchingData: true });
    try {
      const res = await axiosInstance.get(`/admin/security/logs?page=${page}`);
      set((state) => ({
        auditLogs: res.data.logs,
        pagination: { ...state.pagination, auditLogs: res.data.pagination },
      }));
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      set({ isFetchingData: false });
    }
  },

  fetchSystemConfig: async () => {
    try {
      const res = await axiosInstance.get("/admin/system/config");
      set({ systemConfig: res.data.config });
    } catch (error) {
      console.error("Failed to fetch system config", error);
    }
  },

  fetchSystemTelemetry: async () => {
    try {
      const res = await axiosInstance.get("/admin/system/telemetry");
      set({ systemTelemetry: res.data.health });
    } catch (error) {
      console.error("Failed to fetch system telemetry", error);
    }
  },

  fetchInsights: async () => {
    try {
      const res = await axiosInstance.get("/admin/system/insights");
      set({ insights: res.data.insights || [] });
    } catch (error) {
      console.error("Failed to fetch insights", error);
    }
  },

  updateSystemConfig: async (updates) => {
    try {
      const res = await axiosInstance.put("/admin/system/config", updates);
      set({ systemConfig: res.data.config });
      toast.success(res.data.message || "Configuration updated");
    } catch (error) {
      toast.error("Failed to update system config");
      console.error("Failed to update system config", error);
    }
  },

  // Real-time Event Handling
  addLiveEvent: (event) => {
    set((state) => {
      const newEvents = [event, ...state.liveEvents].slice(0, 100); // Keep last 100 events
      return { liveEvents: newEvents };
    });
  },

  addInsight: (insight) => {
    set((state) => {
      const newInsights = [insight, ...state.insights].slice(0, 50);
      return { insights: newInsights };
    });
  },

  sendNotification: async (payload) => {
    try {
      const res = await axiosInstance.post("/admin/broadcast/notification", payload);
      toast.success(res.data.message || "Notification sent");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send notification");
      return false;
    }
  },

  sendSystemMessage: async (payload) => {
    try {
      const res = await axiosInstance.post("/admin/broadcast/system-message", payload);
      toast.success(res.data.message || "System message sent");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send system message");
      return false;
    }
  },

  sendEmailBroadcast: async (payload) => {
    try {
      const res = await axiosInstance.post("/admin/broadcast/email", payload);
      toast.success(res.data.message || "Email broadcast sent");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send email");
      return false;
    }
  },
}));

// Call this once from AdminLayout after auth is confirmed
export const initAdminSocket = () => {
  const socket = getSocket();
  socket.on('system_event', (event) => {
    useAdminStore.getState().addLiveEvent(event);
  });

  socket.on('system_insight', (insight) => {
    useAdminStore.getState().addInsight(insight);
  });
};
