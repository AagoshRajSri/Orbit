/**
 * SpotifyPage — Theme-aware Spotify integration page.
 * All themes use the same powerful SpotifyPlayer core,
 * with per-theme chrome (header, colours, back button).
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music, LogOut, ChevronLeft, Loader } from "lucide-react";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useThemeStore } from "../store/useThemeStore";
import { spotifyService } from "../services/spotifyService";
import SpotifyPlayer from "../components/spotify/SpotifyPlayer";
import SpotifySessionManager from "../components/spotify/SpotifySessionManager";
import OrbitalPageWrapper from "../components/layout/OrbitalPageWrapper";

// ── Per-theme chrome config ──────────────────────────────────────────────────
const CHROME = {
  "light": {
    bg:         "linear-gradient(180deg, #F8F5EF 0%, #F2EBE1 100%)",
    headerBg:   "rgba(255,255,255,0.85)",
    headerBorder:"rgba(234,228,216,0.8)",
    accent:     "#6DA37A",
    accentText: "#fff",
    text:       "#1C2431",
    subtext:    "#6B6560",
    back:       { bg: "#fff", border: "#EAE4D8", color: "#6B6560" },
    icon:       { bg: "linear-gradient(135deg, #6DA37A, #4a8856)", color: "#fff" },
    fontTitle:  "'Cormorant Garamond', serif",
  },
  "pastel-dream": {
    bg:         "linear-gradient(145deg, #ffd4ee 0%, #f0ccf8 100%)",
    headerBg:   "rgba(255,255,255,0.7)",
    headerBorder:"rgba(255,183,230,0.4)",
    accent:     "#d464b0",
    accentText: "#fff",
    text:       "#7b3a6e",
    subtext:    "#c084a8",
    back:       { bg: "rgba(255,255,255,0.6)", border: "#f5c0e8", color: "#c084a8" },
    icon:       { bg: "linear-gradient(135deg, #f472b6, #a855f7)", color: "#fff" },
    fontTitle:  "'Nunito', sans-serif",
  },
  "dark": {
    bg:         "linear-gradient(180deg, #0a0000 0%, #050000 100%)",
    headerBg:   "rgba(10,0,0,0.85)",
    headerBorder:"rgba(139,0,0,0.25)",
    accent:     "#dc143c",
    accentText: "#fff",
    text:       "#f0d8d0",
    subtext:    "rgba(240,216,208,0.5)",
    back:       { bg: "rgba(139,0,0,0.1)", border: "rgba(139,0,0,0.3)", color: "rgba(240,216,208,0.7)" },
    icon:       { bg: "linear-gradient(135deg, #8b0000, #dc143c)", color: "#fff" },
    fontTitle:  "'Cinzel Decorative', serif",
  },
  "neon-cyberpunk": {
    bg:         "linear-gradient(180deg, #060810 0%, #030508 100%)",
    headerBg:   "rgba(4,2,20,0.85)",
    headerBorder:"rgba(0,255,245,0.12)",
    accent:     "#00fff5",
    accentText: "#000",
    text:       "#e0f8ff",
    subtext:    "rgba(0,255,245,0.4)",
    back:       { bg: "rgba(0,255,245,0.05)", border: "rgba(0,255,245,0.15)", color: "rgba(0,255,245,0.6)" },
    icon:       { bg: "linear-gradient(135deg, #0a0030, #00fff5)", color: "#000" },
    fontTitle:  "'Orbitron', monospace",
  },
  "gamer-high-energy": {
    bg:         "linear-gradient(180deg, #080614 0%, #050410 100%)",
    headerBg:   "rgba(8,6,20,0.85)",
    headerBorder:"rgba(0,245,212,0.15)",
    accent:     "#00f5d4",
    accentText: "#000",
    text:       "#e0fff8",
    subtext:    "rgba(0,245,212,0.45)",
    back:       { bg: "rgba(0,245,212,0.06)", border: "rgba(0,245,212,0.2)", color: "rgba(0,245,212,0.7)" },
    icon:       { bg: "linear-gradient(135deg, #1DB954, #00f5d4)", color: "#000" },
    fontTitle:  "'Orbitron', monospace",
  },
  "amoled-dark": {
    bg:         "#000",
    headerBg:   "rgba(0,0,0,0.92)",
    headerBorder:"rgba(78,205,196,0.12)",
    accent:     "#4ECDC4",
    accentText: "#000",
    text:       "#e0fff8",
    subtext:    "rgba(78,205,196,0.45)",
    back:       { bg: "rgba(78,205,196,0.05)", border: "rgba(78,205,196,0.15)", color: "rgba(78,205,196,0.6)" },
    icon:       { bg: "linear-gradient(135deg, #0a2a2a, #4ECDC4)", color: "#000" },
    fontTitle:  "'Orbitron', monospace",
  },
};

const DEFAULT_CHROME = CHROME["amoled-dark"];

// ── SpotifyLogo SVG ──────────────────────────────────────────────────────────
function SpotifyLogo({ size = 22, color = "#1DB954" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.352-.674.463-1.025.249-2.857-1.745-6.452-2.14-10.686-1.171-.403.092-.806-.162-.899-.565-.092-.402.162-.806.565-.898 4.636-1.06 8.607-.611 11.796 1.338.351.214.463.673.249 1.047zm1.467-3.257c-.271.442-.846.582-1.288.311-3.27-2.007-8.256-2.589-12.122-1.416-.499.151-1.023-.133-1.174-.633-.151-.499.133-1.023.633-1.174 4.417-1.34 9.909-.691 13.639 1.602.443.271.583.847.312 1.31zm.126-3.411c-3.922-2.329-10.395-2.545-14.153-1.405-.6.181-1.237-.161-1.418-.761-.181-.6.161-1.237.761-1.418 4.304-1.306 11.455-1.053 15.986 1.636.539.319.715 1.014.396 1.553-.319.539-1.014.715-1.572.395z" />
    </svg>
  );
}

// ── Connection screen ────────────────────────────────────────────────────────
function ConnectScreen({ chrome, onConnect, isLoading }) {
  const t = chrome;
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: t.bg,
      padding: 32,
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 420,
        padding: 48,
        borderRadius: 28,
        background: t.headerBg,
        border: `1px solid ${t.headerBorder}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow blobs */}
        <div style={{ position: "absolute", top: -60, left: -60, width: 160, height: 160, borderRadius: "50%", background: t.accent, opacity: 0.08, filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 160, height: 160, borderRadius: "50%", background: t.accent, opacity: 0.05, filter: "blur(40px)", pointerEvents: "none" }} />

        {/* Icon */}
        <div style={{
          width: 96, height: 96, borderRadius: 28, margin: "0 auto 28px",
          background: t.icon.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 16px 40px ${t.accent}40`,
          position: "relative",
        }}>
          <SpotifyLogo size={40} color={t.icon.color} />
        </div>

        <h1 style={{
          fontFamily: t.fontTitle,
          fontSize: 28, fontWeight: 800,
          color: t.text,
          marginBottom: 12, lineHeight: 1.2,
        }}>
          Connect Spotify
        </h1>
        <p style={{ fontSize: 14, color: t.subtext, marginBottom: 36, lineHeight: 1.7 }}>
          Link your Spotify account to browse playlists, liked songs, and control playback directly inside Orbit.
        </p>

        <ul style={{ textAlign: "left", listStyle: "none", padding: 0, margin: "0 0 36px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "🎵 Full in-app music browser",
            "🎛 Playback controls & seek bar",
            "📋 Your playlists & liked songs",
            "👥 Shared listening sessions",
          ].map(f => (
            <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: t.text, opacity: 0.85 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={onConnect}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: 14,
            background: t.accent,
            color: t.accentText,
            border: "none",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.08em",
            cursor: "pointer",
            boxShadow: `0 8px 24px ${t.accent}50`,
            transition: "transform 0.15s, box-shadow 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 12px 32px ${t.accent}60`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 8px 24px ${t.accent}50`; }}
        >
          {isLoading
            ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Connecting...</>
            : <><SpotifyLogo size={18} color={t.accentText} /> Connect with Spotify</>
          }
        </button>

        <p style={{ marginTop: 16, fontSize: 11, color: t.subtext, opacity: 0.5 }}>
          Requires a Spotify account. Premium recommended for in-browser playback.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SpotifyPage() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const {
    isHost, spotifyProfile, setSpotifyProfile,
    spotifyLinked, disconnectSpotify, startPolling, stopPolling,
  } = useSpotifyStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSession, setShowSession] = useState(false);

  const chrome = CHROME[theme] || DEFAULT_CHROME;

  // Check if already linked on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (!spotifyLinked) {
          const result = await spotifyService.getProfile();
          if (result?.linked) {
            setSpotifyProfile(result.profile);
          }
        }
      } catch (err) {
        console.error("Spotify init:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [spotifyLinked, setSpotifyProfile]);

  // Start polling while on this page
  useEffect(() => {
    if (spotifyLinked) {
      startPolling();
      return () => stopPolling();
    }
  }, [spotifyLinked, startPolling, stopPolling]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await spotifyService.initiateLogin();
    } catch (err) {
      console.error("Spotify connect failed:", err);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Spotify from Orbit?")) return;
    try {
      await disconnectSpotify();
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ position: "fixed", inset: 0, background: chrome.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${chrome.accent}30`, borderTopColor: chrome.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontFamily: chrome.fontTitle, fontSize: 12, color: chrome.subtext, letterSpacing: "0.3em", textTransform: "uppercase" }}>Synchronizing...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <OrbitalPageWrapper>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: chrome.bg, position: "relative" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: chrome.headerBg,
          borderBottom: `1px solid ${chrome.headerBorder}`,
          backdropFilter: "blur(20px)",
          flexShrink: 0,
          zIndex: 10,
        }}>
          {/* Left: back + branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: 10,
                background: chrome.back.bg,
                border: `1px solid ${chrome.back.border}`,
                color: chrome.back.color,
                cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                transition: "opacity 0.15s",
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: chrome.icon.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${chrome.accent}40`,
                flexShrink: 0,
              }}>
                <SpotifyLogo size={22} color={chrome.icon.color} />
              </div>
              <div>
                <h1 style={{
                  fontFamily: chrome.fontTitle,
                  fontSize: 18, fontWeight: 800,
                  color: chrome.text,
                  lineHeight: 1,
                  margin: 0,
                }}>
                  {theme === "dark" ? "Nocturnal Harmony"
                    : theme === "neon-cyberpunk" ? "Audio Sync"
                    : theme === "gamer-high-energy" ? "Spotify Sync"
                    : theme === "amoled-dark" ? "ORBIT PLAYER"
                    : theme === "light" ? "Musical Resonance"
                    : "Spotify Sync ✨"}
                </h1>
                {spotifyLinked && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: chrome.accent, animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 10, color: chrome.subtext, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
                      {isHost ? "Host" : "Connected"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: profile + disconnect */}
          {spotifyLinked && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isHost && (
                <button
                  onClick={() => setShowSession(s => !s)}
                  style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: showSession ? chrome.accent : "transparent",
                    border: `1px solid ${chrome.headerBorder}`,
                    color: showSession ? chrome.accentText : chrome.subtext,
                    cursor: "pointer", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.1em",
                    transition: "all 0.2s",
                  }}
                >
                  Session
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img
                  src={spotifyProfile?.profileImage || `https://ui-avatars.com/api/?name=${spotifyProfile?.displayName || "U"}&background=1DB954&color=fff`}
                  alt="Profile"
                  style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${chrome.accent}40`, objectFit: "cover" }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: chrome.text }}>{spotifyProfile?.displayName}</div>
                  <div style={{ fontSize: 10, color: chrome.subtext }}>Spotify</div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                title="Disconnect"
                style={{
                  padding: 7, borderRadius: 9,
                  background: "transparent",
                  border: `1px solid ${chrome.headerBorder}`,
                  color: chrome.subtext,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                onMouseLeave={e => e.currentTarget.style.color = chrome.subtext}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          {/* Session sidebar */}
          {spotifyLinked && isHost && showSession && (
            <div style={{
              width: 300,
              borderRight: `1px solid ${chrome.headerBorder}`,
              background: chrome.headerBg,
              backdropFilter: "blur(20px)",
              flexShrink: 0,
              overflowY: "auto",
            }}>
              <SpotifySessionManager />
            </div>
          )}

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!spotifyLinked ? (
              <ConnectScreen
                chrome={chrome}
                onConnect={handleConnect}
                isLoading={isConnecting}
              />
            ) : (
              <SpotifyPlayer />
            )}
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </OrbitalPageWrapper>
  );
}
