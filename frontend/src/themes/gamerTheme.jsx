import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { useSettingsStore } from "../store/useSettingsStore";
import { spotifyService } from "../services/spotifyService";
import GamerThemeLayout from "../components/layout/themes/gamer/GamerThemeLayout";

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const NeonCard = ({ children, color = "#00cfff", style = {} }) => (
  <div style={{ background: "rgba(10, 10, 20, 0.8)", border: `1px solid ${color}33`, borderRadius: 16, position: "relative", padding: 20, ...style }}>
    {children}
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, color = "#00cfff" }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 20, borderRadius: 10, background: checked ? color : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#000" : "#666", position: "absolute", top: 2, left: checked ? 22 : 2, transition: "all 0.3s" }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   CHAT CARD
───────────────────────────────────────────── */
function ChatCard() {
  return (
    <NeonCard color="#ff2d78" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, height: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, border: "1.5px solid rgba(255,45,120,0.6)", background: "rgba(255,45,120,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 0 8px rgba(255,45,120,0.3)", marginBottom: 8 }}>🎮</div>
          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.15em", color: "#ff2d78", textTransform: "uppercase", textShadow: "0 0 8px #ff2d78", fontFamily: "'Orbitron',monospace", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            ORBIT GAMES <span style={{ fontSize: 10 }}>🔒</span>
          </div>
          <div style={{ fontSize: 9.5, color: "rgba(200,140,170,0.7)", lineHeight: 1.5 }}>Coming soon. A new way to play together.</div>
        </div>
        <div style={{ flexShrink: 0 }}><HoloGlobe /></div>
      </div>
      <div style={{ position: "absolute", bottom: 26, left: 14, right: 14, height: "0.5px", background: "rgba(255,45,120,0.2)" }} />
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: "rgba(255,45,120,0.4)", fontWeight: "bold" }}>⚡</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   NOTIF CARD (with Daily Quests inside)
───────────────────────────────────────────── */
function NotifCard() {
  return (
    <NeonCard color="#ffaa00" style={{ padding: "12px 14px", display: "flex", gap: 10, height: "100%", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid rgba(255,170,0,0.6)", background: "rgba(255,170,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 0 8px rgba(255,170,0,0.3)" }}>🔔</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "#ffaa00", textShadow: "0 0 8px #ffaa00", fontFamily: "'Orbitron',monospace" }}>GET NOTIFICATIONS</div>
            <div style={{ fontSize: 8.5, color: "rgba(200,160,80,0.65)", lineHeight: 1.4 }}>Stay updated with real-time alerts</div>
          </div>
        </div>
        <DailyQuests />
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 4, overflow: "hidden", boxShadow: "0 0 8px rgba(0,245,212,0.1)", background: "rgba(0,20,15,0.6)" }}>
        <RadarSweep />
      </div>
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: "rgba(255,170,0,0.4)", fontWeight: "bold" }}>↓</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   CUSTOMIZE CARD
───────────────────────────────────────────── */
function CustomizeCard() {
  return (
    <NeonCard color="#00cfff" style={{ padding: "12px 14px", display: "flex", gap: 8, height: "100%", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid rgba(0,207,255,0.6)", background: "rgba(0,207,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 0 8px rgba(0,207,255,0.3)" }}>⚙️</div>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.15em", color: "#00cfff", textTransform: "uppercase", textShadow: "0 0 8px #00cfff", fontFamily: "'Orbitron',monospace" }}>CUSTOMIZE</div>
        <div style={{ fontSize: 9.5, color: "rgba(100,190,220,0.7)", lineHeight: 1.5 }}>Configure your orbit behavior and preferences</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 2 }}>
          {[{ l: "MATCHES", v: "284" }, { l: "TOP 1%", v: "YES" }, { l: "HOURS", v: "1,240" }, { l: "STREAK", v: "7d" }].map(s => (
            <div key={s.l} style={{ padding: "3px 6px", borderRadius: 3, background: "rgba(0,207,255,0.06)", border: "1px solid rgba(0,207,255,0.18)" }}>
              <div style={{ fontSize: 6.5, color: "rgba(0,207,255,0.45)", letterSpacing: "0.12em", fontFamily: "'Orbitron',monospace" }}>{s.l}</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#00cfff", fontFamily: "'Orbitron',monospace", textShadow: "0 0 4px #00cfff" }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><Gears /></div>
      <div onClick={() => window.location.href = "/settings"} style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: "rgba(0,207,255,0.4)", fontWeight: "bold", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#00cfff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(0,207,255,0.4)"}>↑</div>
    </NeonCard>
  );
}

function StatusBar({ locked }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 24, height: "1px", background: "rgba(0,245,212,0.4)" }} />
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", color: "#00f5d4", textShadow: "0 0 6px #00f5d4", fontFamily: "'Orbitron',monospace" }}>STATUS: ONLINE</span>
      <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
        {Array.from({ length: 26 }, (_, i) => (
          <div key={i} style={{ width: 2, height: 4 + Math.sin(i * 0.5) * 3, background: "#00f5d4", opacity: 0.65 + (i % 3) * 0.1, boxShadow: "0 0 3px #00f5d4" }} />
        ))}
      </div>
      {locked && <div style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 2, background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.6)", fontSize: 8, fontWeight: 900, color: "#ff2d78", fontFamily: "'Orbitron',monospace", letterSpacing: "0.15em", animation: "lockedPulse 2s infinite" }}>🔒 GRIND ACTIVE</div>}
    </div>
  );
}

export default function OrbitGrind({ children }) {
  const navRef = useRef(null), sidebarRef = useRef(null), heroRef = useRef(null);
  const c0 = useRef(null), c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const [locked, setLocked] = useState(false);
  const [killCount, setKillCount] = useState(14);
  const { logout } = useAuthStore();
  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const { users, selectedUser, selectedUserId, setSelectedUser } = useChatStore();

  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const userSelected = Boolean(selectedUser || selectedUserId);

  // ── Hidden Nexus State ──
  const [hiddenNexuses, setHiddenNexuses] = useState(() => {
      try {
          const saved = localStorage.getItem('gamer_hidden_nexuses');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  const toggleHide = (nexus, e) => {
      if (e) e.stopPropagation();
      const id = nexus._id;
      const isHidden = (hiddenNexuses || []).some(h => h._id === id);
      
      if (!isHidden && hiddenNexuses.length >= 3) {
          import("react-hot-toast").then(({ toast }) => toast.error("Maximum 3 hidden Nexuses allowed per theme."));
          return;
      }

      const next = isHidden
          ? hiddenNexuses.filter(h => h._id !== id)
          : [...hiddenNexuses, { _id: id, name: nexus.name }];
      
      setHiddenNexuses(next);
      localStorage.setItem('gamer_hidden_nexuses', JSON.stringify(next));
  };

  const onReveal = (id) => {
      const next = hiddenNexuses.filter(h => h._id !== id);
      setHiddenNexuses(next);
      localStorage.setItem('gamer_hidden_nexuses', JSON.stringify(next));
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = [c0, c1, c2, c3].map(r => r?.current).filter(Boolean);
      const nav = navRef.current;
      const sidebar = sidebarRef.current;
      const hero = heroRef.current;

      if (nav) gsap.set(nav, { opacity: 0, y: -20 });
      if (sidebar) gsap.set(sidebar, { opacity: 0, x: -30 });
      if (hero) gsap.set(hero, { opacity: 0, y: 14 });
      if (cards.length > 0) gsap.set(cards, { opacity: 0, y: 24, scale: 0.94 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (nav) tl.to(nav, { opacity: 1, y: 0, duration: 0.5 });
      if (sidebar) tl.to(sidebar, { opacity: 1, x: 0, duration: 0.45 }, "-=0.3");
      if (hero) tl.to(hero, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25");

      if (cards.length > 0) {
        tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.09 }, "-=0.2");
      }
    });
    return () => ctx.revert();
  }, []);

  const handleLockIn = useCallback(() => {
    setLocked(p => {
      const isLocking = !p;
      if (isLocking) {
        gsap.to("body", { filter: "hue-rotate(90deg) contrast(1.5)", duration: 0.1, yoyo: true, repeat: 5 });
        if (heroRef.current) gsap.fromTo(heroRef.current, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        gsap.fromTo(document.body, { x: -8 }, { x: 0, duration: 0.08, yoyo: true, repeat: 7, clearProps: "x" });
      } else if (!isLocking) {
        gsap.to("body", { filter: "none", duration: 0.3 });
      }
      return isLocking;
    });
    setKillCount(k => k + (Math.floor(Math.random() * 3) + 1));
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", fontFamily: "'Space Grotesk','Rajdhani',system-ui,sans-serif", background: "#040212" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes debrisFloat{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-8px) rotate(10deg);}}
        @keyframes starBlink{0%,100%{opacity:0.55;transform:scale(1);}50%{opacity:1;transform:scale(1.2);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
        @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}
        @keyframes lockedPulse{0%,100%{opacity:1;box-shadow:0 0 10px currentColor;}50%{opacity:0.7;box-shadow:0 0 25px currentColor;}}
        *{box-sizing:border-box;} button:focus{outline:none;}
        ::-webkit-scrollbar{width:3px;height:3px;} 
        ::-webkit-scrollbar-track{background:rgba(0,0,0,0.5);}
        ::-webkit-scrollbar-thumb{background:rgba(0,245,212,0.25);border-radius:0;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(0,245,212,0.55);}

        .gamer-chat-env .nexus-chat-container {
          background: #0a0a0a !important;
          border: 4px solid #1a1a1a !important;
          border-radius: 4px !important;
          box-shadow: inset 0 0 10px #000 !important;
        }
        .gamer-chat-env .nexus-chat-header { 
          background: repeating-linear-gradient(45deg, #111, #111 6px, #1a1a1a 6px, #1a1a1a 12px) !important;
          border-bottom: 2px solid #333 !important;
          border-radius: 4px 4px 0 0 !important;
        }
        .gamer-chat-env .nexus-chat-header .text-base-content,
        .gamer-chat-env .nxc-name { 
          color: #ff2d78 !important; font-family: 'Orbitron', sans-serif !important; letter-spacing: 2px !important; text-shadow: 0 0 8px #ff2d78 !important; font-weight: 900 !important;
        }
        .gamer-chat-env .nxc-utility-group,
        .gamer-chat-env .nxc-telemetry-capsule {
          background: #111 !important;
          border: 1.5px solid #333 !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 2px 0px rgba(255,255,255,0.1) !important;
          border-radius: 0px !important;
        }
        .gamer-chat-env .nxc-hbtn, .gamer-chat-env .nxc-aero-btn {
          background: #1a1a1a !important; color: #fff !important;
          border-radius: 0px !important; border: 1px solid #ff2d78 !important;
          animation: rgb-border 4s linear infinite !important;
        }
        @keyframes rgb-border { 
           0% { border-color: #ff0000; box-shadow: inset 0 0 5px #ff0000; }
          33% { border-color: #00ff00; box-shadow: inset 0 0 5px #00ff00; }
          66% { border-color: #0000ff; box-shadow: inset 0 0 5px #0000ff; }
          100% { border-color: #ff0000; box-shadow: inset 0 0 5px #ff0000; }
        }
        .gamer-chat-env .nxc-signal-bars { display: flex; align-items: flex-end; gap: 1px; }
        .gamer-chat-env .nxc-signal-bars .nxc-bar { background: #ff2d78 !important; width: 4px !important; border-radius: 0 !important; height: 10px !important; }
        .gamer-chat-env .bg-white/20 { background: #333 !important; }
        .gamer-chat-env .nxi-shell { 
          background: rgba(4,2,18,0.92) !important; 
          border-top: 1px solid rgba(0,245,212,0.3) !important;
        }
        .gamer-chat-env .nxi-send.ready { background: #ff2d78 !important; border: 1px solid #ff2d78 !important; box-shadow: 0 0 10px #ff2d78 !important; color: #fff !important; }
        .gamer-chat-env .nxi-textarea { background: rgba(0,245,212,0.06) !important; border: 1px solid rgba(0,245,212,0.2) !important; color: #fff !important; font-family: 'Rajdhani', sans-serif !important; font-weight: 500 !important; font-size: 15px !important; }
        .gamer-chat-env .nxi-textarea:focus { border-color: #00f5d4 !important; box-shadow: 0 0 10px rgba(0,245,212,0.3) !important; }
        .gamer-chat-env .nxi-tool-btn, .gamer-chat-env .nxi-mic { color: #00f5d4 !important; }
        .gamer-chat-env .msg-bubble-mine { 
          background: rgba(255,45,120,0.15) !important; 
          border: 1.5px solid #ff2d78 !important; 
          box-shadow: 0 0 12px rgba(255,45,120,0.3) !important;
          font-family: 'Rajdhani', sans-serif !important;
          color: #fff !important;
        }
        .gamer-chat-env .msg-bubble-other { 
          background: rgba(0,245,212,0.08) !important; 
          border: 1.5px solid rgba(0,245,212,0.4) !important; 
          font-family: 'Rajdhani', sans-serif !important;
          color: #fff !important;
        }

        @media (max-width: 768px) {
          .gamer-container { flex-direction: column !important; }
          .gamer-container.chat-inactive { overflow-y: auto; overflow-x: hidden; }
          .gamer-sidebar { width: 100% !important; border-right: none !important; border-bottom: 2px solid #333 !important; flex: none !important; }
          .gamer-container.chat-active .gamer-sidebar { display: none !important; }
          .gamer-main { min-height: 600px; flex: none !important; }
          .gamer-container.chat-active .gamer-main { min-height: auto; flex: 1 !important; display: flex; flex-direction: column; overflow: hidden !important; }
        }
      `}</style>


      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%,rgba(80,0,120,0.55) 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,rgba(0,60,120,0.45) 0%,transparent 45%),radial-gradient(ellipse at 60% 80%,rgba(0,80,60,0.35) 0%,transparent 40%),radial-gradient(ellipse at 10% 80%,rgba(120,0,80,0.3) 0%,transparent 40%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.35) 1px,transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none", opacity: 0.25 }} />

      <Scanlines />
      <DebrisLayer />
      <TopNav 
        navRef={navRef} 
        locked={locked} 
        killCount={killCount} 
        setSelectedNexus={setSelectedNexus}
        setSelectedUser={setSelectedUser}
        logout={logout}
        hiddenNexuses={hiddenNexuses}
        onReveal={onReveal}
      />
    ))}
  </div>
);

export default function OrbitGrind({ children }) {
  return <GamerThemeLayout children={children} />;
}

export function GamerSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  isDirty, handleSave, handleReset
}) {
  const navigate = useNavigate();
  const sections = [
    { id: "profile", label: "IDENTITY" },
    { id: "appearance", label: "VISUALS" },
  ];

  return (
    <OrbitGrind>
      <div style={{ display: "flex", gap: 20, height: "100%", padding: 20 }}>
        <NeonCard color="#00cfff" style={{ width: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: activeSection === tab.id ? "rgba(0,207,255,0.15)" : "transparent", border: "1px solid", borderColor: activeSection === tab.id ? "#00cfff" : "transparent", borderRadius: 8, color: activeSection === tab.id ? "#fff" : "rgba(0,207,255,0.6)", fontFamily: "'Orbitron', monospace", fontSize: 13, cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => handleSave()} disabled={!isDirty} style={{ padding: 14, background: isDirty ? "#00cfff" : "transparent", color: isDirty ? "#000" : "#00cfff", border: "1px solid #00cfff", borderRadius: 8, cursor: isDirty ? "pointer" : "default" }}>COMMIT</button>
            <button onClick={() => handleReset()} disabled={!isDirty} style={{ padding: 14, background: "transparent", color: "#00cfff", border: "1px solid #00cfff", borderRadius: 8, cursor: isDirty ? "pointer" : "default" }}>ROLLBACK</button>
            <button onClick={() => navigate("/")} style={{ padding: 14, background: "transparent", border: "1px solid #ff2d78", color: "#ff2d78", borderRadius: 8, cursor: "pointer" }}>EXIT</button>
          </div>
        </NeonCard>

        <NeonCard color="#00cfff" style={{ flex: 1, overflowY: "auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#00cfff", fontFamily: "'Orbitron',monospace", marginBottom: 24 }}>SYSTEM_PREFERENCES // {activeSection.toUpperCase()}</h2>
          {activeSection === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <input value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid #00cfff", color: "#fff", padding: 12, borderRadius: 8 }} />
            </div>
          )}
          {activeSection === "appearance" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {THEMES.map(t => (
                <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 12, border: draftTheme === t ? "1px solid #00cfff" : "1px solid rgba(0,207,255,0.2)", borderRadius: 8, cursor: "pointer", textAlign: "center" }}>
                   <div style={{ fontSize: 11, color: "#00cfff" }}>{THEME_LABELS[t] || t}</div>
                </div>
              ))}
            </div>
          )}
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}

export function GamerProfile() {
  const authUser = useAuthStore(s => s.authUser);
  const navigate = useNavigate();
  return (
    <OrbitGrind>
      <div style={{ display: "flex", gap: 20, height: "100%", padding: 20 }}>
        <NeonCard color="#ff2d78" style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <img src={authUser?.profilePic || "/avatar.png"} style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid #ff2d78" }} alt="avatar" />
          <h2 style={{ fontSize: 20, color: "#fff" }}>{authUser?.username}</h2>
          <p style={{ color: "#ff2d78" }}>{authUser?.bio || "No mission bio."}</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 20, padding: "10px 20px", background: "transparent", border: "1px solid #ff2d78", color: "#ff2d78", cursor: "pointer" }}>BACK</button>
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}

export function GamerSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  return (
    <OrbitGrind>
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: 32, color: "#1DB954", marginBottom: 40 }}>SPOTIFY SYNC</h2>
        <NeonCard color="#1DB954" style={{ maxWidth: 500, margin: "0 auto" }}>
          {!spotifyLinked ? (
            <button onClick={() => spotifyService.initiateLogin()} style={{ padding: "12px 24px", background: "#1DB954", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>INITIALIZE LINK</button>
          ) : (
            <div>
              <img src={currentTrack?.imageUrl || "/spotify.png"} style={{ width: 240, height: 240, borderRadius: 16, border: "2px solid #1DB954" }} alt="track art" />
              <div style={{ fontSize: 24, color: "#fff", marginTop: 20 }}>{currentTrack?.name || "Awaiting Signal..."}</div>
              <div style={{ height: 60, marginTop: 20 }}>
                <AudioViz playing={isPlaying} />
              </div>
              <button onClick={() => isPlaying ? pausePlayback() : playTrack()} style={{ width: 64, height: 64, borderRadius: "50%", background: "#1DB954", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", marginTop: 20 }}>{isPlaying ? "⏸" : "▶"}</button>
            </div>
          )}
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}
