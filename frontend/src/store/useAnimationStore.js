import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAnimationStore = create(
  persist(
    (set) => ({
      masterEnabled: true,
      preset: "immersive", // "immersive", "balanced", "minimal", "custom"
      
      // Granular configs
      config: {
        microInteractions: true,
        transitions: true,
        atmospheric: true,
        speedMultiplier: 1.0,
      },

      setMasterEnabled: (enabled) => set((state) => ({
        masterEnabled: enabled
      })),

      setPreset: (presetName) => set((state) => {
        if (presetName === "custom") return { preset: "custom" };
        
        const configs = {
          immersive: { microInteractions: true, transitions: true, atmospheric: true, speedMultiplier: 1.0 },
          balanced: { microInteractions: true, transitions: true, atmospheric: false, speedMultiplier: 1.0 },
          minimal: { microInteractions: false, transitions: false, atmospheric: false, speedMultiplier: 1.0 }
        };
        
        return { 
          preset: presetName, 
          config: { ...state.config, ...configs[presetName] } 
        };
      }),
      
      updateConfig: (key, value) => set((state) => ({
        config: { ...state.config, [key]: value },
        preset: "custom" // Switches to custom if manually tweaked
      })),
    }),
    { name: "animation-preferences" }
  )
);
