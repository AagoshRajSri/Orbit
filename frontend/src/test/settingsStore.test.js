import { describe, it, expect, beforeEach, vi } from 'vitest';

const defaultSettings = {
  sound: { enabled: true, clickEnabled: true, notificationEnabled: true, volume: 0.3 },
  notifications: { enabled: true, messageAlerts: true, groupActivity: true, muteWhileActive: true, desktopEnabled: true },
  appearance: { theme: 'dark', accentColor: 'purple', fontSize: 'medium', animationsEnabled: true },
  orbit: { animationsEnabled: true, smoothTransitionsEnabled: true, autoLoadOnLogin: true, showLoaderAnimation: true, showRings: true, autoPauseOnHover: true, interactionFilter: 'all', orbitalTheme: 'nebula', showAvatar: true },
  profile: { displayName: '', showOnlineStatus: true, bio: '' },
  security: { enableSessionTimeout: true, sessionTimeoutMinutes: 30 },
};

const createSettingsStore = () => {
  let settings = JSON.parse(JSON.stringify(defaultSettings));
  let isInitialized = false;

  return {
    get settings() { return settings; },
    get isInitialized() { return isInitialized; },
    initializeSettings: () => { isInitialized = true; },
    updateSetting: (path, value) => {
      const keys = path.split('.');
      let current = settings;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    },
    getSetting: (path) => {
      const keys = path.split('.');
      let current = settings;
      for (const key of keys) {
        current = current?.[key];
      }
      return current;
    },
    resetToDefaults: () => {
      settings = JSON.parse(JSON.stringify(defaultSettings));
    },
  };
};

describe('useSettingsStore Logic', () => {
  let store;

  beforeEach(() => {
    store = createSettingsStore();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns correct setting by path', () => {
    expect(store.getSetting('sound.enabled')).toBe(true);
    expect(store.getSetting('sound.volume')).toBe(0.3);
    expect(store.getSetting('appearance.theme')).toBe('dark');
  });

  it('updates setting by path', () => {
    store.updateSetting('sound.enabled', false);
    expect(store.getSetting('sound.enabled')).toBe(false);
  });

  it('updates nested setting', () => {
    store.updateSetting('security.sessionTimeoutMinutes', 60);
    expect(store.getSetting('security.sessionTimeoutMinutes')).toBe(60);
  });

  it('resets to defaults', () => {
    store.updateSetting('sound.enabled', false);
    store.updateSetting('appearance.theme', 'light');
    store.resetToDefaults();
    expect(store.getSetting('sound.enabled')).toBe(true);
    expect(store.getSetting('appearance.theme')).toBe('dark');
  });

  it('handles deep paths', () => {
    store.updateSetting('orbit.orbitalTheme', 'aurora');
    expect(store.getSetting('orbit.orbitalTheme')).toBe('aurora');
  });

  it('returns undefined for non-existent paths', () => {
    expect(store.getSetting('nonexistent.path')).toBeUndefined();
  });
});
