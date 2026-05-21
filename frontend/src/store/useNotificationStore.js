import { create } from "zustand";
import { axiosInstance } from "../lib/axios.jsx";

export const useNotificationStore = create((set, get) => ({
  // Transient Toasts (UI)
  notifications: [], // Used by NotificationContainer and toast.js
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [...state.notifications, notification]
    }));
    
    // Auto-remove transient toasts
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, notification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  // Persistent Inbox Notifications (DB)
  inbox: [],
  unreadCount: 0,
  isInboxLoading: false,

  fetchInbox: async () => {
    set({ isInboxLoading: true });
    try {
      const res = await axiosInstance.get("/notifications");
      const notifs = res.data;
      set({ 
        inbox: notifs, 
        unreadCount: notifs.filter(n => !n.read).length 
      });
    } catch (error) {
      console.error("Failed to fetch inbox notifications:", error);
    } finally {
      set({ isInboxLoading: false });
    }
  },

  addInboxNotification: (notification) => {
    set((state) => {
      if (state.inbox.some(n => n._id === notification._id)) return state;
      const newInbox = [notification, ...state.inbox];
      return {
        inbox: newInbox,
        unreadCount: state.unreadCount + (notification.read ? 0 : 1)
      };
    });
  },

  markAsRead: async (notificationId) => {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
      set((state) => ({
        inbox: state.inbox.map(n => n._id === notificationId ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error("Failed to mark inbox notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      set((state) => ({
        inbox: state.inbox.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Failed to mark all inbox notifications as read:", error);
    }
  },

  clear: () => set({ notifications: [], inbox: [], unreadCount: 0 })
}));
