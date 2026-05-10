import React, { useState } from "react";
import { X, Hash, Wand2, Sparkles, ArrowRight } from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";
import { useThemeStore } from "../../store/useThemeStore";
import toast from "react-hot-toast";
import { useSoundManager } from "../../hooks/useSoundManager";

export default function NexusActionOverlay({ mode, onClose, inline = false }) {
  const { play } = useSoundManager();
  const { joinNexus, createNexus } = useNexusStore();
  const { theme } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", desc: "" });

  const isPastel = theme === "pastel-dream";
  const isAmoled = theme === "amoled-dark";
  const isDark = theme === "dark";
  const isNeon = theme === "neon-cyberpunk";
  const isGamer = theme === "gamer-high-energy";
  const isLight = theme === "light";

  const handleJoin = async (e) => {
    e?.preventDefault();
    if (!formData.code.trim()) return toast.error("Please enter a valid code.");
    setLoading(true);
    try {
      await joinNexus(formData.code.trim().toUpperCase());
      toast.success("Joined Nexus!");
      play("click");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join Nexus.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) return toast.error("Nexus name is required.");
    setLoading(true);
    try {
      await createNexus({ name: formData.name.trim(), description: formData.desc.trim() });
      toast.success("Nexus instantiated.");
      play("click");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create Nexus.");
    } finally {
      setLoading(false);
    }
  };

  // Theme-specific tokens
  const getTokens = () => {
    if (isPastel) return {
      bg: "linear-gradient(135deg, #fff0f9 0%, #fdf0ff 50%, #f0f4ff 100%)",
      accent: "#e87bbf",
      accentSoft: "rgba(232,123,191,0.12)",
      accentBorder: "rgba(232,123,191,0.3)",
      text: "#c05090",
      textMuted: "rgba(192,80,144,0.55)",
      inputBg: "rgba(255,255,255,0.8)",
      inputBorder: "rgba(232,123,191,0.25)",
      inputText: "#9b3d7a",
      btnBg: "linear-gradient(135deg, #e87bbf, #c070e0)",
      btnText: "#fff",
      closeColor: "#c050a0",
      closeBg: "rgba(232,123,191,0.18)",
      closeBorder: "rgba(232,123,191,0.85)",
      closeGlow: "0 0 8px rgba(232,123,191,0.7), 0 0 18px rgba(232,123,191,0.35)",
      fontFamily: "'Nunito', 'Inter', sans-serif",
      panelBg: "linear-gradient(135deg, rgba(255,192,220,0.15), rgba(200,160,255,0.12))",
      glyph: "✨",
      tagline: mode === "create" ? "Create something magical ✨" : "Find your crew 🌸",
      decorBorderRadius: "2.5rem",
    };
    if (isAmoled) return {
      bg: "#000",
      accent: "#C6A06E",
      accentSoft: "rgba(198,160,110,0.08)",
      accentBorder: "rgba(198,160,110,0.2)",
      text: "#E8C990",
      textMuted: "rgba(198,160,110,0.45)",
      inputBg: "#050505",
      inputBorder: "rgba(198,160,110,0.15)",
      inputText: "#E8C990",
      btnBg: "#C6A06E",
      btnText: "#000",
      closeColor: "#E8C990",
      closeBg: "rgba(198,160,110,0.14)",
      closeBorder: "rgba(198,160,110,0.85)",
      closeGlow: "0 0 8px rgba(198,160,110,0.65), 0 0 18px rgba(198,160,110,0.3)",
      fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
      panelBg: "rgba(198,160,110,0.04)",
      glyph: "◈",
      tagline: mode === "create" ? "ESTABLISH A NEW NODE" : "SYNC TO A FREQUENCY",
      decorBorderRadius: "0px",
    };
    if (isDark) return {
      bg: "#050508",
      accent: "#DC143C",
      accentSoft: "rgba(139,0,0,0.1)",
      accentBorder: "rgba(139,0,0,0.3)",
      text: "#F0E6D3",
      textMuted: "rgba(168,155,176,0.6)",
      inputBg: "rgba(10,10,16,0.8)",
      inputBorder: "rgba(139,0,0,0.2)",
      inputText: "#F0E6D3",
      btnBg: "linear-gradient(135deg, #8B0000, #DC143C)",
      btnText: "#F0E6D3",
      closeColor: "#FF4060",
      closeBg: "rgba(139,0,0,0.22)",
      closeBorder: "rgba(220,20,60,0.9)",
      closeGlow: "0 0 8px rgba(220,20,60,0.75), 0 0 20px rgba(139,0,0,0.45)",
      fontFamily: "'Cinzel', serif",
      panelBg: "rgba(139,0,0,0.05)",
      glyph: "🩸",
      tagline: mode === "create" ? "Summon a new coven" : "Enter the crimson gates",
      decorBorderRadius: "0px",
    };
    if (isNeon) return {
      bg: "#090014",
      accent: "#00fff5",
      accentSoft: "rgba(0,255,245,0.06)",
      accentBorder: "rgba(0,255,245,0.2)",
      text: "#00fff5",
      textMuted: "rgba(0,255,245,0.4)",
      inputBg: "rgba(0,0,0,0.6)",
      inputBorder: "rgba(0,255,245,0.15)",
      inputText: "#fff",
      btnBg: "linear-gradient(90deg, #b026ff, #00fff5)",
      btnText: "#000",
      closeColor: "#00fff5",
      closeBg: "rgba(0,255,245,0.1)",
      closeBorder: "rgba(0,255,245,0.9)",
      closeGlow: "0 0 8px rgba(0,255,245,0.8), 0 0 20px rgba(176,38,255,0.4)",
      fontFamily: "'Share Tech Mono', monospace",
      panelBg: "rgba(176,38,255,0.04)",
      glyph: "◉",
      tagline: mode === "create" ? "// INITIALIZE_NEW_NODE" : "// SYNC_TO_GRID",
      decorBorderRadius: "0px",
    };
    if (isGamer) return {
      bg: "#060412",
      accent: "#00f5d4",
      accentSoft: "rgba(0,245,212,0.07)",
      accentBorder: "rgba(0,245,212,0.2)",
      text: "#00f5d4",
      textMuted: "rgba(0,245,212,0.45)",
      inputBg: "rgba(4,2,10,0.9)",
      inputBorder: "rgba(0,245,212,0.15)",
      inputText: "#fff",
      btnBg: "#00f5d4",
      btnText: "#000",
      closeColor: "#00f5d4",
      closeBg: "rgba(0,245,212,0.1)",
      closeBorder: "rgba(0,245,212,0.9)",
      closeGlow: "0 0 8px rgba(0,245,212,0.8), 0 0 20px rgba(255,45,120,0.3)",
      fontFamily: "'Orbitron', 'Rajdhani', monospace",
      panelBg: "rgba(0,245,212,0.04)",
      glyph: "⚡",
      tagline: mode === "create" ? "INITIALIZE NEXUS NODE" : "LINK TO NEXUS GRID",
      decorBorderRadius: "8px",
    };
    if (isLight) return {
      bg: "var(--chat-bg, #f8f6f0)",
      accent: "#b08d57",
      accentSoft: "rgba(176,141,87,0.08)",
      accentBorder: "rgba(176,141,87,0.2)",
      text: "#5c4a2a",
      textMuted: "rgba(92,74,42,0.5)",
      inputBg: "rgba(255,255,255,0.9)",
      inputBorder: "rgba(176,141,87,0.2)",
      inputText: "#5c4a2a",
      btnBg: "#b08d57",
      btnText: "#fff",
      closeColor: "#7a5c30",
      closeBg: "rgba(176,141,87,0.18)",
      closeBorder: "rgba(176,141,87,0.85)",
      closeGlow: "0 0 6px rgba(176,141,87,0.6), 0 0 14px rgba(176,141,87,0.3)",
      fontFamily: "'Georgia', serif",
      panelBg: "rgba(176,141,87,0.05)",
      glyph: "✦",
      tagline: mode === "create" ? "Establish a refined space" : "Join an exclusive circle",
      decorBorderRadius: "1.5rem",
    };
    // Default
    return {
      bg: "var(--chat-bg, #1a1a2e)",
      accent: "var(--chat-primary, #6366f1)",
      accentSoft: "rgba(99,102,241,0.08)",
      accentBorder: "rgba(99,102,241,0.2)",
      text: "var(--chat-text, #e2e8f0)",
      textMuted: "rgba(226,232,240,0.5)",
      inputBg: "rgba(255,255,255,0.05)",
      inputBorder: "rgba(99,102,241,0.2)",
      inputText: "var(--chat-text, #e2e8f0)",
      btnBg: "var(--chat-primary, #6366f1)",
      btnText: "#fff",
      closeColor: "#a5b4fc",
      closeBg: "rgba(99,102,241,0.14)",
      closeBorder: "rgba(99,102,241,0.85)",
      closeGlow: "0 0 8px rgba(99,102,241,0.6), 0 0 18px rgba(99,102,241,0.25)",
      fontFamily: "'Inter', sans-serif",
      panelBg: "rgba(99,102,241,0.04)",
      glyph: "◈",
      tagline: mode === "create" ? "Start something new" : "Connect with a group",
      decorBorderRadius: "1rem",
    };
  };

  const tk = getTokens();

  // ── Non-inline (modal) mode ─────────────────────────────────────
  if (!inline) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 440, background: tk.bg, border: `1px solid ${tk.accentBorder}`, borderRadius: tk.decorBorderRadius, padding: 32, fontFamily: tk.fontFamily, boxShadow: `0 20px 80px rgba(0,0,0,0.5)` }}>
          <button onClick={() => { play("click"); onClose(); }} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: tk.closeBg, border: `2px solid ${tk.closeBorder}`, boxShadow: tk.closeGlow, color: tk.closeColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "transform 0.15s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.18)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>✕</button>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: tk.accentSoft, border: `1px solid ${tk.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: tk.accent }}>{mode === "create" ? <Wand2 size={24} /> : <Hash size={24} />}</div>
            <h2 style={{ fontSize: 22, color: tk.text, margin: "0 0 8px" }}>{mode === "create" ? "Establish Nexus" : "Link to Nexus"}</h2>
            <p style={{ fontSize: 13, color: tk.textMuted, margin: 0 }}>{tk.tagline}</p>
          </div>
          <form onSubmit={mode === "create" ? handleCreate : handleJoin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "create" ? (
              <>
                <input type="text" required placeholder="Nexus Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={{ width: "100%", padding: "12px 16px", background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: 8, color: tk.inputText, fontFamily: tk.fontFamily, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <textarea rows={3} placeholder="Description (optional)" value={formData.desc} onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))} style={{ width: "100%", padding: "12px 16px", background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: 8, color: tk.inputText, fontFamily: tk.fontFamily, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </>
            ) : (
              <input type="text" required placeholder="Join Code (e.g. X82K9L)" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} style={{ width: "100%", padding: "14px 16px", background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: 8, color: tk.inputText, fontFamily: tk.fontFamily, fontSize: 16, fontWeight: 700, textAlign: "center", letterSpacing: "0.2em", outline: "none", boxSizing: "border-box" }} />
            )}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", marginTop: 8, background: tk.btnBg, border: "none", borderRadius: 8, color: tk.btnText, fontFamily: tk.fontFamily, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <div style={{ width: 18, height: 18, border: `2px solid ${tk.btnText}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <>{mode === "create" ? <Sparkles size={16} /> : <ArrowRight size={16} />}{mode === "create" ? "Manifest Nexus" : "Execute Join"}</>}
            </button>
          </form>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Inline (full container) mode ────────────────────────────────
  return (
    <div className="nao-container" style={{ width: "100%", height: "100%", minHeight: "100%", display: "flex", background: tk.bg, fontFamily: tk.fontFamily, position: "relative", overflow: "hidden", borderRadius: tk.decorBorderRadius }}>
      <style>{`
        @keyframes nao-spin { to { transform: rotate(360deg); } }
        @keyframes nao-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
        @keyframes nao-pulse { 0%,100%{opacity:0.4;} 50%{opacity:0.8;} }
        .nao-input:focus { border-color: ${tk.accent} !important; box-shadow: 0 0 0 3px ${tk.accentSoft} !important; }
        .nao-input::placeholder { color: ${tk.textMuted}; }
        .nao-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
        .nao-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .nao-close:hover { opacity: 1 !important; }
        @media (max-width: 768px) {
          .nao-container { flex-direction: column !important; overflow-y: auto !important; border-radius: 0 !important; }
          .nao-left-panel { display: none !important; }
          .nao-right-panel { padding: 40px 24px !important; flex: 1 !important; display: flex; flex-direction: column; justify-content: center; min-height: 100dvh; box-sizing: border-box; }
        }
      `}</style>

      {/* ── Left decorative panel ── */}
      <div className="nao-left-panel" style={{ width: "42%", flexShrink: 0, background: tk.panelBg, borderRight: `1px solid ${tk.accentBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden" }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${tk.accentSoft} 0%, transparent 70%)`, top: "10%", left: "-20%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${tk.accentSoft} 0%, transparent 70%)`, bottom: "15%", right: "-10%", pointerEvents: "none" }} />

        {/* Central glyph / icon */}
        <div style={{ animation: "nao-float 4s ease-in-out infinite", marginBottom: 32, zIndex: 1 }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: tk.accentSoft, border: `2px solid ${tk.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: tk.accent, boxShadow: `0 0 40px ${tk.accentSoft}` }}>
            {mode === "create" ? <Wand2 size={48} strokeWidth={1.5} /> : <Hash size={48} strokeWidth={1.5} />}
          </div>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, color: tk.text, textAlign: "center", margin: "0 0 12px", letterSpacing: isAmoled || isGamer || isNeon ? "0.2em" : "0.02em", lineHeight: 1.2, zIndex: 1, position: "relative" }}>
          {mode === "create" ? "Establish Nexus" : "Link to Nexus"}
        </h2>
        <p style={{ fontSize: 14, color: tk.textMuted, textAlign: "center", lineHeight: 1.7, maxWidth: 280, zIndex: 1, position: "relative" }}>
          {mode === "create"
            ? "Create a new collaborative space and invite your team to orbit around a shared mission."
            : "Enter the unique code to join an existing Nexus and connect with its members."}
        </p>

        {/* Tagline badge */}
        <div style={{ marginTop: 32, padding: "8px 20px", border: `1px solid ${tk.accentBorder}`, borderRadius: 999, background: tk.accentSoft, color: tk.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", zIndex: 1, position: "relative", textTransform: "uppercase" }}>
          {tk.tagline}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="nao-right-panel" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 52px", position: "relative" }}>
        {/* Close button */}
        <button
          className="nao-close"
          onClick={() => { play("click"); onClose(); }}
          style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: tk.closeBg, border: `2px solid ${tk.closeBorder}`, boxShadow: tk.closeGlow, color: tk.closeColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transition: "transform 0.15s, box-shadow 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <X size={15} />
        </button>

        {/* Section label */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.3em", color: tk.accent, textTransform: "uppercase", marginBottom: 8, opacity: 0.8 }}>
          {mode === "create" ? "New Nexus" : "Join Nexus"}
        </div>

        <h3 style={{ fontSize: 22, fontWeight: 700, color: tk.text, margin: "0 0 6px", letterSpacing: isAmoled || isGamer || isNeon ? "0.1em" : "0" }}>
          {mode === "create" ? "Configure your space" : "Enter your access code"}
        </h3>
        <p style={{ fontSize: 13, color: tk.textMuted, margin: "0 0 36px", lineHeight: 1.6 }}>
          {mode === "create"
            ? "Give your Nexus a name so others know where to orbit."
            : "Paste or type the code shared by the Nexus owner."}
        </p>

        <form onSubmit={mode === "create" ? handleCreate : handleJoin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "create" ? (
            <>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: tk.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Nexus Name *</label>
                <input
                  type="text"
                  required
                  className="nao-input"
                  placeholder="e.g. Orbital Command"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  style={{ width: "100%", padding: "14px 18px", background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.decorBorderRadius === "0px" ? 0 : 10, color: tk.inputText, fontFamily: tk.fontFamily, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: tk.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
                <textarea
                  rows={4}
                  className="nao-input"
                  placeholder="What is this Nexus for..."
                  value={formData.desc}
                  onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                  style={{ width: "100%", padding: "14px 18px", background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.decorBorderRadius === "0px" ? 0 : 10, color: tk.inputText, fontFamily: tk.fontFamily, fontSize: 15, outline: "none", resize: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" }}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: tk.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Access Code *</label>
              <input
                type="text"
                required
                className="nao-input"
                placeholder="X82K9L"
                value={formData.code}
                onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                style={{ width: "100%", padding: "18px 18px", background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, borderRadius: tk.decorBorderRadius === "0px" ? 0 : 10, color: tk.inputText, fontFamily: tk.fontFamily, fontSize: 28, fontWeight: 800, textAlign: "center", letterSpacing: "0.35em", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" }}
              />
              <p style={{ fontSize: 11, color: tk.textMuted, marginTop: 8, textAlign: "center" }}>
                Ask the Nexus owner for their invite code
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="nao-btn"
            style={{ width: "100%", padding: "16px 24px", marginTop: 8, background: tk.btnBg, border: "none", borderRadius: tk.decorBorderRadius === "0px" ? 0 : 10, color: tk.btnText, fontFamily: tk.fontFamily, fontSize: 14, fontWeight: 800, letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "filter 0.2s, transform 0.15s", textTransform: isAmoled || isGamer || isNeon ? "uppercase" : "none" }}
          >
            {loading
              ? <div style={{ width: 20, height: 20, border: `2px solid ${tk.btnText}`, borderTopColor: "transparent", borderRadius: "50%", animation: "nao-spin 0.8s linear infinite" }} />
              : <>{mode === "create" ? <Sparkles size={18} /> : <ArrowRight size={18} />}{mode === "create" ? "Manifest Nexus" : "Execute Join"}</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
