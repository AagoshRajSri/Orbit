/**
 * Centralized Settings Store
 *
 * Single source of truth for all application preferences:
 * - Sound system configuration
 * - Notifications behavior
 * - Appearance (theme, accent colors)
 * - Orbit-specific behaviors
 * - Profile information
 * - Security preferences
 *
 * All changes persist immediately to localStorage and broadcast
 * to all consumers via Zustand.
 */

import { create } from "zustand";

// Storage keys for persistence
const STORAGE_KEYS = {
  SETTINGS: "orbit_settings_v1",
};

// Default settings configuration - Single source of truth
const DEFAULT_SETTINGS = {
  // Sound System
  sound: {
    enabled: true, // Master sound toggle
    clickEnabled: true, // Button/interaction clicks
    notificationEnabled: true, // Message notifications
    orbitAmbientEnabled: true, // Background ambient sound
    volume: 0.3, // 0.0 - 1.0
  },

  // Notifications
  notifications: {
    enabled: true, // Master notifications toggle
    messageAlerts: true, // New message alerts
    groupActivity: true, // Group/constellation activity
    muteWhileActive: true, // Don't notify when actively chatting
    desktopEnabled: true, // Toast notifications
  },

  // Appearance
  appearance: {
    theme: "light", // Theme name (light/dark/etc)
    accentColor: "purple", // Primary accent
    fontSize: "medium", // small/medium/large
    animationsEnabled: true, // UI animations
  },

  // Orbit-specific behaviors
  orbit: {
    animationsEnabled: true, // Constellation animations
    smoothTransitionsEnabled: true, // Smooth UI transitions
    autoLoadOnLogin: true, // Load orbit view on login
    showLoaderAnimation: true, // Show orbit loader
    showRings: true, // Show orbital rings
    autoPauseOnHover: true, // Pause rings on hover
    interactionFilter: "all", // all/active/mutual
    orbitalTheme: "nebula", // nebula/aurora/cosmic
    showAvatar: true,
  },

  // Profile settings
  profile: {
    displayName: "",
    showOnlineStatus: true,
    bio: "",
  },

  // Security preferences
  security: {
    enableSessionTimeout: true,
    sessionTimeoutMinutes: 30,
  },
};

/**
 * Creates and returns the settings store with Zustand
 * Handles persistence, validation, and immediate application of settings
 */
export const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isInitialized: false,

  /**
   * Initialize settings from localStorage
   * Should be called once on app startup
   */
  initializeSettings: () => {
    const state = get();
    if (state.isInitialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge with defaults to handle schema evolution
        const merged = mergeSettings(DEFAULT_SETTINGS, parsed);
        set({ settings: merged, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error("Failed to initialize settings:", error);
      set({ isInitialized: true });
    }
  },

  /**
   * Update a nested setting value
   * Path example: "sound.enabled", "appearance.theme"
   * Automatically persists and validates
   */
  updateSetting: (path, value) => {
    set((state) => {
      const newSettings = JSON.parse(JSON.stringify(state.settings)); // Deep clone
      const keys = path.split(".");
      let current = newSettings;

      // Navigate to parent
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      // Set value
      const lastKey = keys[keys.length - 1];
      const oldValue = current[lastKey];
      current[lastKey] = value;

      // Persist to localStorage
      try {
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(newSettings),
        );
      } catch (error) {
        console.error("Failed to persist settings:", error);
      }

      // Log for debugging
      console.log(`Settings updated: ${path}`, { oldValue, newValue: value });

      return { settings: newSettings };
    });
  },

  /**
   * Update multiple settings at once
   * partition example: { "sound.enabled": true, "appearance.theme": "light" }
   */
  updateSettings: (updates) => {
    Object.entries(updates).forEach(([path, value]) => {
      get().updateSetting(path, value);
    });
  },

  /**
   * Get a specific setting by path
   */
  getSetting: (path) => {
    const state = get();
    const keys = path.split(".");
    let current = state.settings;

    for (const key of keys) {
      current = current?.[key];
    }

    return current;
  },

  /**
   * Get entire settings object
   */
  getSettings: () => get().settings,

  /**
   * Reset settings to defaults
   */
  resetToDefaults: () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(fresh));
    } catch (error) {
      console.error("Failed to reset settings:", error);
    }
    set({ settings: fresh });
  },

  /**
   * Export settings for backup/transfer
   */
  exportSettings: () => get().settings,

  /**
   * Import settings from exported data
   */
  importSettings: (settings) => {
    const merged = mergeSettings(DEFAULT_SETTINGS, settings);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
    set({ settings: merged });
    return true;
  },
}));

/**
 * Deep merge settings with defaults to handle schema evolution
 * Ensures new settings from updates don't break old stored data
 */
function mergeSettings(defaults, stored) {
  const result = JSON.parse(JSON.stringify(defaults));

  function merge(target, source) {
    for (const key in source) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else if (typeof source[key] !== "undefined") {
        target[key] = source[key];
      }
    }
  }

  merge(result, stored);
  return result;
}
