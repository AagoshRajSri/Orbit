/**
 * useSoundManager Hook
 *
 * Provides reactive access to the SoundManager with real-time settings integration.
 * All sound behavior is controlled by useSettingsStore preferences.
 *
 * Usage: const { play, toggle, isEnabled } = useSoundManager();
 */

import { useCallback } from "react";
import { soundManager } from "../lib/SoundManager";
import { useSettingsStore } from "../store/useSettingsStore";

export const useSoundManager = () => {
  // Subscribe to sound settings changes
  const soundSettings = useSettingsStore((state) => state.settings.sound);

  const play = useCallback((soundName, options) => {
    soundManager.play(soundName, options);
  }, []);

  const toggle = useCallback(() => {
    return soundManager.toggle();
  }, []);

  const setVolume = useCallback((volume) => {
    soundManager.setVolume(volume);
  }, []);

  const setSoundTypeEnabled = useCallback((soundType, enabled) => {
    soundManager.setSoundTypeEnabled(soundType, enabled);
  }, []);

  const isSoundTypeEnabled = useCallback((soundType) => {
    return soundManager.isSoundTypeEnabled(soundType);
  }, []);

  const isEnabled = soundSettings?.enabled ?? false;

  return {
    play,
    toggle,
    setVolume,
    setSoundTypeEnabled,
    isSoundTypeEnabled,
    isEnabled,
    stopAll: () => soundManager.stopAll(),
    volumeLevel: soundSettings?.volume ?? 0.3,
  };
};

export default useSoundManager;
