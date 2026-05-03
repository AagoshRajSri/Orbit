import React from "react";
import { useAnimationStore } from "../../store/useAnimationStore";

export default function AnimationSettingsPanel({ isPastel = false }) {
  const { masterEnabled, preset, config, setMasterEnabled, setPreset, updateConfig } = useAnimationStore();

  const primaryColor = isPastel ? "#d060a8" : "currentColor";
  const secondaryColor = isPastel ? "#a855f7" : "currentColor";
  const bgClass = isPastel ? "bg-white/60" : "bg-base-200/50";
  const borderClass = isPastel ? "border-pink-300/30" : "border-base-300/60";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold" style={{ color: primaryColor }}>Motion & Animations</h3>
        <p className="text-sm mt-1 opacity-70">
          Control the intensity and visibility of animations across the app.
        </p>
      </div>

      <div className={`rounded-2xl border ${borderClass} ${bgClass} backdrop-blur-md p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-sm">Global Animation Engine</div>
            <div className="text-xs opacity-70 mt-1">Turn off all non-essential motion.</div>
          </div>
          <input
            type="checkbox"
            className={`toggle ${isPastel ? "toggle-secondary" : "toggle-primary"}`}
            checked={masterEnabled}
            onChange={(e) => setMasterEnabled(e.target.checked)}
          />
        </div>

        {masterEnabled && (
          <>
            <div className="divider opacity-30 my-2"></div>
            <div className="space-y-4 mt-4">
              <div className="font-semibold text-sm mb-2" style={{ color: secondaryColor }}>Preset Profiles</div>
              <div className="flex gap-2">
                {["immersive", "balanced", "minimal"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`btn btn-sm ${preset === p ? (isPastel ? "btn-secondary text-white" : "btn-primary") : "btn-ghost border border-base-300/50"}`}
                    style={{ textTransform: "capitalize" }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="divider opacity-30 my-2"></div>
              <div className="font-semibold text-sm mb-2" style={{ color: secondaryColor }}>Granular Controls</div>
              
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm">Micro-interactions (Hovers, Clicks)</span>
                <input
                  type="checkbox"
                  className={`toggle toggle-sm ${isPastel ? "toggle-secondary" : "toggle-primary"}`}
                  checked={config.microInteractions}
                  onChange={(e) => updateConfig("microInteractions", e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm">Page & Layout Transitions</span>
                <input
                  type="checkbox"
                  className={`toggle toggle-sm ${isPastel ? "toggle-secondary" : "toggle-primary"}`}
                  checked={config.transitions}
                  onChange={(e) => updateConfig("transitions", e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm">Atmospheric Effects (Particles, BG)</span>
                <input
                  type="checkbox"
                  className={`toggle toggle-sm ${isPastel ? "toggle-secondary" : "toggle-primary"}`}
                  checked={config.atmospheric}
                  onChange={(e) => updateConfig("atmospheric", e.target.checked)}
                />
              </label>

              <div className="divider opacity-30 my-2"></div>
              <div className="font-semibold text-sm mb-2" style={{ color: secondaryColor }}>Animation Speed</div>
              <div className="flex items-center gap-4">
                <span className="text-xs opacity-70">Slow</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={config.speedMultiplier}
                  onChange={(e) => updateConfig("speedMultiplier", parseFloat(e.target.value))}
                  className={`range range-sm ${isPastel ? "range-secondary" : "range-primary"} flex-1`} 
                />
                <span className="text-xs opacity-70">Fast</span>
              </div>
              <div className="text-center text-xs font-bold opacity-60">{config.speedMultiplier}x</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
