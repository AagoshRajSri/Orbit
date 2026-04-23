/**
 * Notification Store - Zustand
 * Manages all application notifications
 */

import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => {
    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n.id !== notification.id,
          ),
        }));
      }, notification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));
