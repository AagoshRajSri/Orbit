import { create } from "zustand";
import { THEMES } from "../constants";
import { applyTheme, initTheme } from "../lib/themeSwitcher";

// Initialize theme from localStorage and apply it immediately
const getInitialTheme = () =>
  initTheme({
    allowedThemes: THEMES,
    defaultTheme: "light",
  });

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  settingsStore: null,

  /**
   * Initialize settings integration
   * This is called from App.jsx after settings are hydrated
   */
  initializeSettingsIntegration: (settingsStore) => {
    set((state) => {
      if (state.settingsStore) return state; // Already initialized

      // Subscribe to theme changes in settings
      settingsStore.subscribe(
        (settings) => settings.settings.appearance.theme,
        (newTheme) => {
          if (typeof window !== "undefined" && THEMES.includes(newTheme)) {
            applyTheme(newTheme);
          }
          set({ theme: newTheme });
        },
      );

      return { settingsStore };
    });
  },

  setTheme: (newTheme) => {
    set((state) => {
      if (typeof window !== "undefined" && THEMES.includes(newTheme)) {
        applyTheme(newTheme);
      }

      // Also update settings store if it's initialized
      if (state.settingsStore) {
        state.settingsStore
          .getState()
          .updateSetting("appearance.theme", newTheme);
      }

      return { theme: newTheme };
    });
  },

  isConfirming: false,
  pendingTheme: null,
  setIsConfirming: (val, theme = null) => set({ isConfirming: val, pendingTheme: theme }),
}));
