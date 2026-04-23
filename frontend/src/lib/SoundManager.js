/**
 * Centralized Sound Manager
 *
 * Handles preloading, playback, and volume control for all audio assets.
 * Integrates with useSettingsStore for all preferences and runtime behavior.
 *
 * Features:
 * - Preloaded audio assets for low-latency playback
 * - Settings-driven configuration (respects user preferences)
 * - Current time reset on playback for rapid consecutive plays
 * - Debouncing to prevent overlapping sounds
 * - Real-time reactive to settings changes
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.globalVolume = 0.3; // Will be overridden by settings
    this.lastPlayTime = {};
    this.debounceDelay = 100; // ms, prevent sounds overlapping
    this.isInitialized = false;
    this.settingsStore = null; // Will be set after init
    this.settingsUnsubscribe = null;

    // Preload all sounds on initialization
    this.init();

    // Interaction unlocker to bypass browser autoplay restrictions
    this._unlockAudio = () => {
      if (this.currentAmbient && this.sounds[this.currentAmbient]?.paused) {
        // Retry playing ambient if it was blocked
        const theme = this.currentAmbient.replace('ambient_', '')
          .replace('vampire', 'dark')
          .replace('gamer', 'gamer-high-energy')
          .replace('pastel', 'pastel-dream')
          .replace('cyberpunk', 'neon-cyberpunk');
        this.playAmbient(theme);
      }
      document.removeEventListener('click', this._unlockAudio);
      document.removeEventListener('keydown', this._unlockAudio);
    };
    document.addEventListener('click', this._unlockAudio);
    document.addEventListener('keydown', this._unlockAudio);
  }

  /**
   * Initialize settings integration
   * Must be called after app boots to connect to settings store
   */
  initializeSettingsIntegration(settingsStore) {
    if (this.settingsStore) return; // Already initialized

    this.settingsStore = settingsStore;
    this.updateFromSettings();

    // Subscribe to settings changes - pass selector and callback
    this.settingsUnsubscribe = settingsStore.subscribe(
      (state) => state.settings.sound,
      () => this.updateFromSettings(),
    );
  }

  /**
   * Update sound settings from the settings store
   */
  updateFromSettings() {
    if (!this.settingsStore) return;

    // Get the current state from the store
    const settings = this.settingsStore.getState().settings;
    if (settings && settings.sound) {
      this.globalVolume = settings.sound.volume || 0.3;

      // Update all preloaded sounds with new volume, safely ignoring the ones actively fading
      Object.values(this.sounds).forEach((audio) => {
        if (!audio.fadeInterval) {
          audio.volume = this.globalVolume;
        }
      });
    }
  }

  /**
   * Initialize and preload all audio assets
   */
  init() {
    if (this.isInitialized) return;

    // Define all available sounds
    const soundAssets = [
      { name: "click", path: "/sounds/click.wav" },
      { name: "notification", path: "/sounds/notification.wav" },
      { name: "incomingmsg", path: "/sounds/incomingmsg.wav" },
      { name: "yourorbit", path: "/sounds/yourorbit.wav" },
      { name: "ambient_dark", path: "/sounds/darkTheme/darkelectropop - PoorArtistt.mp3" },
      { name: "ambient_gamer", path: "/sounds/gamerTheme/Retro Synthwave - UsefulPix.mp3" },
      { name: "ambient_pastel", path: "/sounds/pastelTheme/pastelAmbience.mp3" },
      { name: "ambient_cyberpunk", path: "/sounds/neonTheme/Cyberpunk - Tunetrove.mp3" },
    ];

    soundAssets.forEach(({ name, path }) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      // Ensure ambient tracks always loop
      if (name.startsWith("ambient_")) {
        audio.loop = true;
      }
      audio.volume = this.globalVolume;
      this.sounds[name] = audio;
    });

    this.currentAmbient = null;
    this.isInitialized = true;
  }

  /**
   * Play a sound by name
   * Respects all sound settings from the settings store
   *
   * @param {string} soundName - Name of the sound ("click", "notification")
   * @param {Object} options - Optional configuration
   * @param {number} options.volume - Optional volume override (0.0 - 1.0)
   * @param {boolean} options.ignoreMute - Force play even if muted
   *
   * Sound rules respect settings:
   * - "click": Requires sound.enabled && sound.clickEnabled
   * - "notification": Requires sound.enabled && sound.notificationEnabled
   * - "ambient": Requires sound.enabled && sound.orbitAmbientEnabled
   */
  play(soundName, options = {}) {
    if (!this.settingsStore) {
      console.warn("SoundManager: Settings not initialized");
      return;
    }

    // Get sound settings from store
    const settings = this.settingsStore.getState().settings;
    const soundSettings = settings?.sound;
    if (!soundSettings) return;

    // Master volume must be enabled
    if (!soundSettings.enabled && !options.ignoreMute) {
      return;
    }

    // Check specific sound type enablement
    if (!options.ignoreMute) {
      switch (soundName) {
        case "click":
          if (!soundSettings.clickEnabled) return;
          break;
        case "notification":
          if (!soundSettings.notificationEnabled) return;
          break;
        case "ambient":
          if (!soundSettings.orbitAmbientEnabled) return;
          break;
        // Other sounds respect master toggle only
      }
    }

    const audio = this.sounds[soundName];
    if (!audio) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    // Debounce check: prevent sound from playing too frequently
    const now = Date.now();
    const lastPlay = this.lastPlayTime[soundName] || 0;

    if (now - lastPlay < this.debounceDelay) {
      return; // Sound played too recently, skip
    }

    this.lastPlayTime[soundName] = now;

    try {
      // Reset playback to allow rapid consecutive plays
      audio.currentTime = 0;

      // Apply optional volume override or use global volume
      if (options.volume !== undefined) {
        audio.volume = options.volume;
      } else {
        audio.volume = this.globalVolume;
      }

      // Trigger playback
      const playPromise = audio.play();

      // Handle autoplay restrictions (some browsers require user interaction)
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`Audio playback failed for ${soundName}:`, error);
        });
      }
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll() {
    Object.values(this.sounds).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Toggle master sound on/off
   * Updates settings store which persists automatically
   */
  toggle() {
    if (!this.settingsStore) {
      console.warn("SoundManager: Settings not initialized");
      return false;
    }

    const settings = this.settingsStore.getState().settings;
    const current = settings?.sound?.enabled ?? false;
    this.settingsStore.getState().updateSetting("sound.enabled", !current);
    return !current;
  }

  /**
   * Set global volume (0.0 - 1.0)
   * Persists to settings store
   */
  setVolume(volume) {
    if (!this.settingsStore) {
      console.warn("SoundManager: Settings not initialized");
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.settingsStore.getState().updateSetting("sound.volume", clampedVolume);
  }

  /**
   * Check if sounds are enabled based on settings
   */
  isEnabledGlobally() {
    if (!this.settingsStore) return false;
    const settings = this.settingsStore.getState().settings;
    return settings?.sound?.enabled ?? false;
  }

  /**
   * Enable or disable a specific sound type
   */
  setSoundTypeEnabled(soundType, enabled) {
    if (!this.settingsStore) {
      console.warn("SoundManager: Settings not initialized");
      return;
    }

    const settingPath = `sound.${soundType}Enabled`;
    this.settingsStore.getState().updateSetting(settingPath, enabled);
  }

  /**
   * Get enabled status for a specific sound type
   */
  isSoundTypeEnabled(soundType) {
    if (!this.settingsStore) return false;
    const settings = this.settingsStore.getState().settings;
    return settings?.sound?.[`${soundType}Enabled`] ?? false;
  }

  /**
   * Cleanup (unsubscribe from settings)
   */
  destroy() {
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
    }
  }

  /**
   * Preload a new sound (useful for dynamic sound additions)
   */
  preloadSound(name, path) {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.volume = this.globalVolume;
    this.sounds[name] = audio;
  }

  /**
   * Smoothly transitions the volume for an audio element
   */
  fadeAudio(audio, targetVolume, durationMs, onComplete = null) {
    if (audio.fadeInterval) clearInterval(audio.fadeInterval);

    // If starting from completely silent and paused, prepare it
    if (audio.paused && targetVolume > 0) {
      audio.volume = 0;
      audio.play().catch((e) => console.warn(`Audio playback failed:`, e));
    }

    const steps = 30; // frequency of updates
    const intervalTime = durationMs / steps;
    const stepAmount = (targetVolume - audio.volume) / steps;

    audio.fadeInterval = setInterval(() => {
      let newVolume = audio.volume + stepAmount;

      if ((stepAmount >= 0 && newVolume >= targetVolume) || (stepAmount <= 0 && newVolume <= targetVolume)) {
        audio.volume = Math.max(0, Math.min(1, targetVolume));
        clearInterval(audio.fadeInterval);
        audio.fadeInterval = null;
        if (onComplete) onComplete();
      } else {
        audio.volume = Math.max(0, Math.min(1, newVolume));
      }
    }, intervalTime);
  }

  /**
   * Play the ambient theme sound
   */
  playAmbient(theme) {
    if (!this.settingsStore) return;

    const settings = this.settingsStore.getState().settings;
    if (!settings?.sound?.enabled || !settings?.sound?.orbitAmbientEnabled) {
      this.stopAmbient();
      return;
    }

    let ambientName = null;
    if (theme === "dark") ambientName = "ambient_dark";
    else if (theme === "gamer-high-energy") ambientName = "ambient_gamer";
    else if (theme === "pastel-dream") ambientName = "ambient_pastel";
    else if (theme === "neon-cyberpunk") ambientName = "ambient_cyberpunk";

    // If changing tracks or stopping
    if (this.currentAmbient && this.currentAmbient !== ambientName) {
      this.stopAmbient();
    }

    if (ambientName) {
      const audio = this.sounds[ambientName];
      if (audio) {
        this.fadeAudio(audio, this.globalVolume, 1500);
        this.currentAmbient = ambientName;
      }
    }
  }

  /**
   * Stop specifically the ambient theme sound
   */
  stopAmbient() {
    if (this.currentAmbient && this.sounds[this.currentAmbient]) {
      const audio = this.sounds[this.currentAmbient];
      this.currentAmbient = null;
      
      this.fadeAudio(audio, 0, 1500, () => {
        audio.pause();
      });
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Also export the class for testing/advanced usage
export default SoundManager;
