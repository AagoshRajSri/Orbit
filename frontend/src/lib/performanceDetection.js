import React from "react";

class PerformanceDetector {
  constructor() {
    this.cache = null;
    this.updateInterval = null;
  }

  /**
   * Detect device performance tier based on:
   * - CPU cores
   * - Memory
   * - Network conditions
   * - Battery saver mode (mobile)
   * - Screen refresh rate
   */
  detect() {
    if (this.cache && Date.now() - this.cache.detectedAt < 60000) {
      return this.cache.profile;
    }

    const profile = {
      tier: "medium", // 'low', 'medium', 'high'
      cpuCores: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4,
      effectiveType: "unknown",
      supportsWebGL: this.checkWebGL(),
      screenRefreshRate: this.getScreenRefreshRate(),
      reducedMotion: this.checkReducedMotion(),
      lowBattery: false, // Default to false, will be updated asynchronously
    };

    // Determine tier
    if (profile.reducedMotion || profile.lowBattery) {
      profile.tier = "low";
    } else if (
      profile.cpuCores >= 8 &&
      profile.memory >= 8 &&
      profile.supportsWebGL
    ) {
      profile.tier = "high";
    } else if (profile.cpuCores >= 4 && profile.memory >= 4) {
      profile.tier = "medium";
    } else {
      profile.tier = "low";
    }

    // Check network
    if ("connection" in navigator) {
      profile.effectiveType = navigator.connection.effectiveType;
      profile.networkEffectiveType = navigator.connection.effectiveType;
      if (
        navigator.connection.effectiveType === "slow-2g" ||
        navigator.connection.effectiveType === "2g"
      ) {
        profile.tier = "low";
      }
    } else {
      profile.networkEffectiveType = "unknown";
    }

    // Check battery asynchronously
    if ("getBattery" in navigator) {
      navigator.getBattery().then((battery) => {
        profile.lowBattery = battery.level < 0.2;
        // Re-determine tier if battery is low
        if (profile.lowBattery) {
          profile.tier = "low";
        }
      }).catch(() => {
        profile.lowBattery = false;
      });
    }

    this.cache = {
      profile,
      detectedAt: Date.now(),
    };

    return profile;
  }

  checkWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  }

  getScreenRefreshRate() {
    // Most devices are 60Hz, high-end devices 120Hz+
    if (!window.requestAnimationFrame) return 60;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }

      if (frameCount < 5) {
        requestAnimationFrame(countFrame);
      }
    };

    requestAnimationFrame(countFrame);
    return fps;
  }

  checkReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  checkLowBattery() {
    if ("getBattery" in navigator) {
      return navigator.getBattery().then((battery) => {
        return battery.level < 0.2;
      }).catch(() => false);
    }
    return Promise.resolve(false);
  }

  getAnimationConfig(baseConfig = {}) {
    const profile = this.detect();

    switch (profile.tier) {
      case "high":
        return {
          duration: baseConfig.duration || 0.6,
          transition: { type: "spring", stiffness: 100, damping: 15 },
          scale: 1,
          blur: 8,
        };
      case "medium":
        return {
          duration: baseConfig.duration || 0.4,
          transition: { type: "ease", duration: 0.3 },
          scale: 0.95,
          blur: 4,
        };
      case "low":
        return {
          duration: 0.2,
          transition: { type: "linear", duration: 0.1 },
          scale: 0.9,
          blur: 0,
          skipAnimations: true,
        };
      default:
        return baseConfig;
    }
  }

  shouldReduceAnimations() {
    const profile = this.detect();
    return profile.tier === "low" || profile.reducedMotion;
  }

  shouldUseSimplifiedUI() {
    const profile = this.detect();
    return profile.tier === "low";
  }

  clearCache() {
    this.cache = null;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  // Start monitoring for changes
  startMonitoring(callback) {
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", () => {
        this.cache = null;
        callback(this.detect());
      });
    }
  }
}

export const performanceDetector = new PerformanceDetector();

/**
 * Hook to use performance detection in React
 */
export function usePerformanceProfile() {
  const [profile, setProfile] = React.useState(() =>
    performanceDetector.detect(),
  );

  React.useEffect(() => {
    const handleChange = (newProfile) => {
      setProfile(newProfile);
    };

    performanceDetector.startMonitoring(handleChange);

    return () => {
      performanceDetector.clearCache();
    };
  }, []);

  return profile;
}
