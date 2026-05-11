import { create } from "zustand";
import { THEMES } from "../constants";
import { applyTheme, initTheme } from "../lib/themeSwitcher";

// Initialize theme from localStorage and apply it immediately
const getInitialTheme = () =>
  initTheme({
    allowedThemes: THEMES,
    defaultTheme: "dark",
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
          let validTheme = newTheme;
          if (!newTheme || !THEMES.includes(newTheme)) {
            validTheme = "dark"; // Fallback to a known valid theme
          }
          
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
    set((state) => {
      let validTheme = newTheme;
      if (!newTheme || !THEMES.includes(newTheme)) {
        validTheme = "dark";
      }

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
