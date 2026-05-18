import { create } from "zustand";
import { THEMES } from "../constants";
import { applyTheme, initTheme } from "../lib/themeSwitcher";
import toast from "react-hot-toast";

// Force light theme initially for all devices
const getInitialTheme = () => "light";

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
          const validTheme = "light"; // Enforce light theme always
          
          if (typeof window !== "undefined") {
            applyTheme(validTheme);
          }
          set({ theme: validTheme });
        },
      );

      return { settingsStore };
    });
  },

  setTheme: (newTheme) => {
    if (newTheme && newTheme !== "light") {
      toast.error("Coming Soon ✦ This theme is currently under development!", {
        id: "coming-soon-theme",
        icon: "🎨",
        style: {
          borderRadius: '12px',
          background: '#1C1C1C',
          color: '#FFF',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: '500',
        }
      });
      return {};
    }

    set((state) => {
      const validTheme = "light";

      if (typeof window !== "undefined") {
        applyTheme(validTheme);
      }

      // Also update settings store if it's initialized
      if (state.settingsStore) {
        state.settingsStore
          .getState()
          .updateSetting("appearance.theme", validTheme);
      }

      return { theme: validTheme };
    });
  },

}));
