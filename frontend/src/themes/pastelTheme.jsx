import { useState, useEffect, useRef } from "react";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useAuthStore } from "../store/useAuthStore";
import NexusActionOverlay from "../components/NexusActionOverlay";
import { useSoundManager } from "../hooks/useSoundManager";

/* ── floating glitter/hearts/butterflies scattered everywhere ── */
const FLOATIES = [
  { x: 245, y: 62, char: "✦", size: 9, color: "#f8c8e8", opacity: 0.75, dur: 2.8 },
  { x: 770, y: 58, char: "✦", size: 8, color: "#e8c8f8", opacity: 0.65, dur: 3.1 },
  { x: 958, y: 75, char: "✦", size: 10, color: "#ffd6f0", opacity: 0.7, dur: 2.5 },
  { x: 760, y: 85, char: "✺", size: 7, color: "#ffb8d8", opacity: 0.55, dur: 3.4 },
  { x: 858, y: 110, char: "✦", size: 7, color: "#e0c8ff", opacity: 0.55, dur: 2.9 },
  { x: 930, y: 130, char: "☽", size: 18, color: "#f0d8ff", opacity: 0.6, dur: 4.0 },
  { x: 950, y: 170, char: "✦", size: 7, color: "#c8f0e0", opacity: 0.5, dur: 3.2 },
  { x: 760, y: 160, char: "✦", size: 6, color: "#ffd8ee", opacity: 0.45, dur: 2.7 },
  { x: 254, y: 160, char: "✦", size: 8, color: "#c8f0d8", opacity: 0.6, dur: 3.0 },
  { x: 262, y: 310, char: "✦", size: 7, color: "#d8f0c8", opacity: 0.5, dur: 3.3 },
  { x: 966, y: 320, char: "✦", size: 7, color: "#d8c8f8", opacity: 0.5, dur: 2.6 },
  { x: 972, y: 460, char: "✦", size: 22, color: "#ffe8f0", opacity: 0.8, dur: 3.8 },
  { x: 250, y: 440, char: "✦", size: 7, color: "#c8f0e8", opacity: 0.45, dur: 2.9 },
  /* bonus cute extras */
  { x: 310, y: 95, char: "♡", size: 11, color: "#ffaad0", opacity: 0.55, dur: 3.5 },
  { x: 690, y: 200, char: "♡", size: 8, color: "#ffb8d8", opacity: 0.45, dur: 4.2 },
  { x: 820, y: 400, char: "♡", size: 10, color: "#ffaad0", opacity: 0.4, dur: 3.7 },
  { x: 400, y: 50, char: "✿", size: 12, color: "#ffd0e8", opacity: 0.5, dur: 3.9 },
  { x: 600, y: 430, char: "✿", size: 9, color: "#e8d0ff", opacity: 0.45, dur: 3.1 },
  { x: 880, y: 55, char: "✿", size: 8, color: "#ffe0f0", opacity: 0.4, dur: 2.8 },
  { x: 500, y: 240, char: "⋆", size: 14, color: "#ffc8e8", opacity: 0.35, dur: 5.0 },
  { x: 150, y: 200, char: "⋆", size: 10, color: "#d8c8ff", opacity: 0.35, dur: 4.5 },
];

/* ── tiny sparkle burst that fires on click ── */
function SparkleClick() {
  const [sparks, setSparks] = useState([]);
  useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      const items = Array.from({ length: 7 }, (_, i) => ({
        id: id + i,
        x: e.clientX, y: e.clientY,
        dx: (Math.random() - 0.5) * 70,
        dy: (Math.random() - 1.2) * 70,
        char: ["✦", "♡", "✿", "⋆", "★"][Math.floor(Math.random() * 5)],
        color: ["#ff8ec8", "#cc88ff", "#88ccff", "#ffcc88", "#88ffcc"][Math.floor(Math.random() * 5)],
      }));
      setSparks(p => [...p, ...items]);
      setTimeout(() => setSparks(p => p.filter(s => !items.find(i => i.id === s.id))), 800);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      {sparks.map(s => (
        <span key={s.id} style={{
          position: "absolute", left: s.x, top: s.y,
          fontSize: 12, color: s.color, lineHeight: 1,
          animation: "sparkFly 0.75s ease-out forwards",
          "--dx": s.dx + "px", "--dy": s.dy + "px",
          transformOrigin: "center",
        }}>{s.char}</span>
      ))}
    </div>
  );
}

function BgClouds() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "-8%", top: "5%", width: 420, height: 340, background: "radial-gradient(ellipse, rgba(255,160,210,0.6) 0%, transparent 70%)", filter: "blur(32px)" }} />
      <div style={{ position: "absolute", left: "5%", top: "-5%", width: 320, height: 260, background: "radial-gradient(ellipse, rgba(220,190,255,0.45) 0%, transparent 70%)", filter: "blur(26px)" }} />
      <div style={{ position: "absolute", left: "18%", top: "0%", width: 360, height: 230, background: "radial-gradient(ellipse, rgba(255,200,230,0.4) 0%, transparent 70%)", filter: "blur(28px)" }} />
      <div style={{ position: "absolute", right: "-5%", top: "10%", width: 300, height: 320, background: "radial-gradient(ellipse, rgba(180,220,255,0.38) 0%, transparent 70%)", filter: "blur(26px)" }} />
      <div style={{ position: "absolute", left: "-2%", bottom: "5%", width: 370, height: 260, background: "radial-gradient(ellipse, rgba(255,150,205,0.45) 0%, transparent 70%)", filter: "blur(30px)" }} />
      <div style={{ position: "absolute", right: "5%", bottom: "0%", width: 310, height: 230, background: "radial-gradient(ellipse, rgba(170,245,215,0.32) 0%, transparent 70%)", filter: "blur(25px)" }} />
      <div style={{ position: "absolute", left: "35%", top: "30%", width: 360, height: 290, background: "radial-gradient(ellipse, rgba(200,235,255,0.28) 0%, transparent 70%)", filter: "blur(30px)" }} />
      {/* extra hot-pink bloom top-right */}
      <div style={{ position: "absolute", right: "15%", top: "-8%", width: 260, height: 200, background: "radial-gradient(ellipse, rgba(255,130,200,0.3) 0%, transparent 70%)", filter: "blur(28px)" }} />
    </div>
  );
}

function Floaties() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {FLOATIES.map((s, i) => (
        <span key={i} style={{
          position: "absolute", left: s.x, top: s.y,
          fontSize: s.size, color: s.color, opacity: s.opacity, lineHeight: 1,
          animation: `starPulse ${s.dur}s ease-in-out infinite`,
          animationDelay: `${i * 0.28}s`,
          userSelect: "none",
        }}>{s.char}</span>
      ))}
    </div>
  );
}

/* ── ribbon badge in top-right of a card ── */
function CuteBadge({ label, color }) {
  return (
    <div style={{
      position: "absolute", top: 10, right: 10,
      background: color,
      borderRadius: 20, padding: "2px 8px",
      fontSize: 8.5, fontWeight: 800, letterSpacing: "0.1em",
      color: "white", textTransform: "uppercase",
      boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
      display: "flex", alignItems: "center", gap: 3,
    }}>✨ {label}</div>
  );
}

function TopNav({ navRef }) {
  const navigate = useNavigate();
  const { authUser, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { setLoggingOut(false); }
  };

  const navBtnBase = {
    display: "flex", alignItems: "center", gap: 5,
    background: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,180,220,0.25)",
    cursor: "pointer",
    fontSize: 11, fontWeight: 800, letterSpacing: "0.05em",
    color: "rgba(180,80,150,0.85)", padding: "5px 11px", borderRadius: 20,
    fontFamily: "inherit", transition: "all 0.22s",
    backdropFilter: "blur(4px)",
    boxShadow: "0 1px 6px rgba(255,150,200,0.12)",
  };

  return (
    <div ref={navRef} style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 18px", zIndex: 30,
      borderBottom: "1px solid rgba(255,180,220,0.3)",
      background: "rgba(255,240,248,0.55)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 2px 20px rgba(255,150,200,0.15)",
    }}>

      {/* ── Left: Logo + user info ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "linear-gradient(135deg, rgba(255,170,220,0.35), rgba(200,160,255,0.3))",
          borderRadius: 22, padding: "4px 12px 4px 6px",
          border: "1px solid rgba(255,180,220,0.4)",
          boxShadow: "0 2px 12px rgba(255,130,200,0.2)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: "linear-gradient(135deg, #ffaad8, #cc88ff, #88ccff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, boxShadow: "0 2px 10px rgba(255,130,200,0.45)",
            flexShrink: 0,
          }}>🌸</div>
          <span style={{
            fontSize: 14, fontWeight: 900, letterSpacing: "0.04em",
            background: "linear-gradient(90deg, #e060b0, #a060e0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Orbit</span>
          <span style={{ fontSize: 11, marginTop: -6, opacity: 0.8 }}>👑</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "rgba(255,160,210,0.3)" }} />

        {/* User avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #ffaad8, #cc88ff)",
              border: "2px solid rgba(255,180,220,0.6)",
              overflow: "hidden", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 900,
              color: "#fff", boxShadow: "0 2px 10px rgba(255,130,200,0.3)",
              flexShrink: 0,
            }}>
              {authUser?.profilePic
                ? <img src={authUser.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (authUser?.username?.[0]?.toUpperCase() || "✿")
              }
            </div>
            {/* Online dot */}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: "50%",
              background: "#5de0a0", border: "2px solid white",
              boxShadow: "0 0 6px rgba(93,224,160,0.7)",
            }} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 800,
            background: "linear-gradient(90deg, #d060a8, #9060d0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {authUser?.username || "Dreamer"}
          </span>
        </div>
      </div>

      {/* ── Right: Nav links + logout ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { label: "Home", icon: "🏠", path: "/" },
          { label: "Spotify", icon: "🎵", path: "/spotify" },
          { label: "Settings", icon: "⚙️", path: "/settings" },
          { label: "Profile", icon: "👤", path: "/profile" },
        ].map(({ label, icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={navBtnBase}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,180,230,0.5), rgba(200,160,255,0.4))";
              e.currentTarget.style.borderColor = "rgba(255,140,200,0.5)";
              e.currentTarget.style.color = "#c040a0";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,130,200,0.25)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.35)";
              e.currentTarget.style.borderColor = "rgba(255,180,220,0.25)";
              e.currentTarget.style.color = "rgba(180,80,150,0.85)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 6px rgba(255,150,200,0.12)";
            }}
          >
            <span style={{ fontSize: 12 }}>{icon}</span>
            {label}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255,160,210,0.35)", margin: "0 2px" }} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: loggingOut
              ? "rgba(255,200,220,0.3)"
              : "linear-gradient(135deg, rgba(255,120,170,0.2), rgba(220,100,160,0.15))",
            border: "1px solid rgba(255,120,170,0.4)",
            cursor: loggingOut ? "not-allowed" : "pointer",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.05em",
            color: "#e0507a", padding: "5px 11px", borderRadius: 20,
            fontFamily: "inherit", transition: "all 0.22s",
            backdropFilter: "blur(4px)",
            boxShadow: "0 1px 6px rgba(255,100,150,0.15)",
            opacity: loggingOut ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!loggingOut) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,100,150,0.35), rgba(220,60,120,0.3))";
              e.currentTarget.style.color = "#c03060";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,80,130,0.3)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,120,170,0.2), rgba(220,100,160,0.15))";
            e.currentTarget.style.color = "#e0507a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 6px rgba(255,100,150,0.15)";
          }}
        >
          <span style={{ fontSize: 12 }}>🚪</span>
          {loggingOut ? "Leaving…" : "Logout"}
        </button>
      </div>
    </div>
  );
}

/* ── cute online status pill ── */
function StatusPill() {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(255,255,255,0.45)", backdropFilter: "blur(6px)",
      borderRadius: 20, padding: "3px 10px 3px 7px",
      border: "1px solid rgba(255,180,220,0.4)",
      marginBottom: 6,
      boxShadow: "0 1px 8px rgba(255,150,200,0.15)",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff7eb8", boxShadow: "0 0 6px #ff7eb8", display: "inline-block", animation: "pulse 1.6s ease-in-out infinite" }} />
      <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.18em", color: "rgba(200,80,140,0.85)", textTransform: "uppercase" }}>STATUS: ONLINE ♡</span>
    </div>
  );
}

function Sidebar({ sidebarRef, nexuses, isNexusesLoading, setSelectedNexus, users, setSelectedUser, nexusUnread }) {
  const [activeTab, setActiveTab] = useState("orbits");
  const { play } = useSoundManager();
  const { setNexusActionView } = useNexusStore();
  const tabStyle = (active) => ({
    flex: 1, border: "none", cursor: "pointer", padding: "8px 0", borderRadius: 16,
    fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", fontFamily: "inherit",
    background: active ? "linear-gradient(135deg, #eecbff, #d1ccff)" : "transparent",
    color: active ? "#8e44ad" : "#a1887f",
    transition: "all 0.25s ease",
    boxShadow: active ? "0 4px 15px rgba(220,180,255,0.4)" : "none",
  });

  return (
    <div ref={sidebarRef} className="w-[220px] flex-shrink-0 flex flex-col border-r border-[#ffb4dc]/15 bg-gradient-to-b from-[#ffdcf3] to-[#fef4f9] px-3 py-[14px]">
      {/* Sidebar Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, paddingLeft: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #ff9fd0, #90c8f8)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
        }}>🌸</div>
        <span style={{ fontSize: 18, fontWeight: 900, color: "#ff479c", letterSpacing: "0.02em" }}>Orbit</span>
        <span style={{ fontSize: 15 }}>👑</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button onClick={() => setActiveTab("orbits")} style={tabStyle(activeTab === "orbits")}># ORBITS</button>
        <button onClick={() => setActiveTab("contacts")} style={{ ...tabStyle(activeTab === "contacts"), opacity: 0.6 }}>
          <span style={{ fontSize: 10, marginRight: 4 }}>💖</span>CONTACTS
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <button
          onClick={() => setNexusActionView("join")}
          style={{
            flex: 1, border: "none", borderRadius: 14, padding: "8px 0",
            fontSize: 11, fontWeight: 900, letterSpacing: "0.08em",
            background: "#ffe4f2", color: "#e8338a", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(255,180,220,0.2)"
          }}># JOIN</button>
        <button
          onClick={() => setNexusActionView("create")}
          style={{
            flex: 1, border: "none", borderRadius: 14, padding: "8px 0",
            fontSize: 11, fontWeight: 900, letterSpacing: "0.08em",
            background: "linear-gradient(90deg, #ff9fd0, #c890f8)",
            color: "white", cursor: "pointer", boxShadow: "0 4px 15px rgba(255,130,200,0.3)"
          }}>+ NEXUS ✨</button>
      </div>

      {/* Center Empty State */}
      <div className="flex-1 overflow-y-auto pr-1" style={{ position: "relative", zIndex: 2 }}>
        {activeTab === "orbits" ? (
          isNexusesLoading ? (
             <div style={{ padding: 12, fontSize: 11, color: "#d596ba", textAlign: "center" }}>💖 Syncing...</div>
          ) : nexuses.length === 0 ? (
            <div style={{ padding: 12, fontSize: 11, color: "#d596ba", textAlign: "center", lineHeight: 1.5 }}>
              No Orbits Yet!<br />Bloom One Below.
            </div>
          ) : (
            nexuses.map(n => (
              <div key={n._id}
                onClick={() => { play("click"); setSelectedNexus(n); }}
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 14, marginBottom: 6, cursor: "pointer",
                  background: "rgba(255,255,255,0.45)", border: "1.5px solid rgba(255,180,220,0.15)", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,180,220,0.15)"; e.currentTarget.style.borderColor = "rgba(255,150,200,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,180,220,0.15)"; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff", border: "1.5px solid #ffb8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, overflow: "hidden" }}>
                  {n.avatar ? <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "◈"}
                </div>
                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#e880b8" }}>{n.name}</div>
                {nexusUnread[n._id] > 0 && (
                  <div style={{ background: "#ff66aa", color: "#fff", fontSize: 9, fontWeight: 900, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(255,102,170,0.4)" }}>{nexusUnread[n._id]}</div>
                )}
              </div>
            ))
          )
        ) : (
          users.length === 0 ? (
            <div style={{ padding: 12, fontSize: 11, color: "#80b8e8", textAlign: "center" }}>No Companions Found.</div>
          ) : (
            users.map(u => (
              <div key={u._id}
                onClick={() => { play("click"); setSelectedUser(u); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, marginBottom: 5, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "1.5px solid #bce4f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, overflow: "hidden" }}>
                  {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#80b8e8", fontWeight: 800 }}>{u.username?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#80b8e8" }}>{u.username}</div>
              </div>
            ))
          )
        )}
      </div>

      {/* Orbit Footer Button */}
      <div onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))}
        className="rounded-3xl p-3 px-[14px] bg-gradient-to-r from-[#ffaadd] to-[#c8ccff] cursor-pointer flex items-center gap-3 shadow-[0_8px_30px_rgba(255,150,210,0.4)] border-2 border-white/40 relative overflow-hidden"
      >
        <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-xl flex-shrink-0">🌸</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "white", letterSpacing: "0.05em", textShadow: "0 1px 4px rgba(200,80,160,0.2)" }}>ENTER YOUR ORBIT</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "0.02em" }}>88 FPS GALAXY ENGINE</div>
          <div style={{ fontSize: 10, color: "white", opacity: 0.8 }}>✦</div>
        </div>
        {/* Wrapping Snake */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4 }}>
          <svg viewBox="0 0 400 100" style={{ width: "130%", height: "130%", position: "absolute", left: "-15%", top: "-15%", transform: "rotate(-2deg)" }}>
            <path className="animate-snake" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" d="M20,75 Q100,15 180,75 Q260,135 340,75" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SpotifyCard({ cardRef }) {
  const [playing, setPlaying] = useState(true);
  const [prog, setProg] = useState(38);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProg(p => p >= 100 ? 0 : p + 0.25), 200);
    return () => clearInterval(iv);
  }, [playing]);
  return (
    <div ref={cardRef} style={{
      background: "linear-gradient(135deg, rgba(185,245,215,0.85) 0%, rgba(210,250,230,0.78) 100%)",
      border: "1px solid rgba(150,225,190,0.55)", borderRadius: 20,
      backdropFilter: "blur(12px)", padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 10, position: "relative",
      boxShadow: "0 4px 20px rgba(100,200,150,0.15)",
    }}>
      <CuteBadge label="vibing" color="linear-gradient(90deg,#4cba88,#70d4a8)" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3dba78", boxShadow: "0 0 6px #3dba78", display: "inline-block", animation: "pulse 1.8s ease-in-out infinite" }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.12em", color: "#3dba78", textTransform: "uppercase" }}>Spotify Active</span>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(60,160,100,0.6)", textTransform: "uppercase", cursor: "pointer" }}>EXPAND</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, overflow: "hidden", boxShadow: "0 3px 10px rgba(0,0,0,0.18)" }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <rect width="56" height="56" fill="#9a8899" />
            <rect x="0" y="10" width="56" height="18" fill="rgba(170,150,160,0.55)" />
            <rect x="0" y="34" width="56" height="12" fill="rgba(130,110,125,0.4)" />
            <rect x="14" y="0" width="14" height="56" fill="rgba(155,135,150,0.25)" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#2a5c3a", letterSpacing: "0.02em" }}>Reflections</div>
          <div style={{ fontSize: 10.5, color: "rgba(60,100,70,0.7)", marginTop: 2 }}>The Neighbourhood</div>
          {/* tiny heart row */}
          <div style={{ fontSize: 8, color: "#ff9ec8", marginTop: 3, letterSpacing: 2 }}>♡ ♡ ♡</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(60,160,100,0.55)", fontSize: 13, padding: 0, lineHeight: 1 }}>⏮</button>
          <button onClick={() => setPlaying(p => !p)} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3dba78, #60d4a0)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 12, boxShadow: "0 3px 12px rgba(60,180,100,0.45)",
            transition: "transform 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{playing ? "⏸" : "▶"}</button>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(60,160,100,0.55)", fontSize: 13, padding: 0, lineHeight: 1 }}>⏭</button>
        </div>
        {/* progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(60,120,80,0.5)" }}>🎵</span>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(60,180,100,0.15)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog}%`, background: "linear-gradient(90deg, #3dba78, #70d4a0)", borderRadius: 2, transition: "width 0.2s linear" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  {
    bg: "linear-gradient(135deg, rgba(252,210,235,0.85) 0%, rgba(255,225,245,0.78) 100%)",
    border: "1px solid rgba(235,175,215,0.55)",
    iconBg: "rgba(220,140,195,0.2)", accent: "#c060a8",
    icon: "💬", title: "START CHATTING",
    desc: "Select a Constellation or create a private conversation",
    bottomIcon: "⚡", line: "rgba(215,165,200,0.38)",
    badge: "new", badgeColor: "linear-gradient(90deg,#e070b8,#c090e8)",
  },
  {
    bg: "linear-gradient(135deg, rgba(255,225,198,0.85) 0%, rgba(255,238,215,0.78) 100%)",
    border: "1px solid rgba(245,192,152,0.55)",
    iconBg: "rgba(230,138,88,0.2)", accent: "#d07840",
    icon: "🔔", title: "GET NOTIFICATIONS",
    desc: "Stay updated with real-time alerts and messages",
    bottomIcon: "↓", line: "rgba(232,188,158,0.38)",
    badge: null,
  },
  {
    bg: "linear-gradient(135deg, rgba(192,235,215,0.85) 0%, rgba(210,248,228,0.78) 100%)",
    border: "1px solid rgba(152,215,183,0.55)",
    iconBg: "rgba(68,168,118,0.18)", accent: "#3d9878",
    icon: "⚙️", title: "CUSTOMIZE",
    desc: "Configure your orbit behavior and preferences",
    bottomIcon: "↑", line: "rgba(158,215,188,0.38)",
    badge: null,
  },
];

function FeatureCard({ cfg, cardRef }) {
  return (
    <div onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))} ref={cardRef} style={{
      background: cfg.bg, border: cfg.border, borderRadius: 20,
      backdropFilter: "blur(12px)", padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 8,
      cursor: "pointer", position: "relative", minHeight: 130,
      transition: "transform 0.22s, box-shadow 0.22s",
      boxShadow: "0 4px 18px rgba(200,160,220,0.1)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.018)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(200,140,220,0.22)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(200,160,220,0.1)"; }}
    >
      {cfg.badge && <CuteBadge label={cfg.badge} color={cfg.badgeColor} />}
      <div style={{ width: 36, height: 36, borderRadius: 12, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cfg.icon}</div>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.13em", color: cfg.accent, textTransform: "uppercase", marginTop: 2 }}>{cfg.title}</div>
      <div style={{ fontSize: 11, color: "rgba(110,88,118,0.72)", lineHeight: 1.55 }}>{cfg.desc}</div>
      <div style={{ position: "absolute", bottom: 32, left: 18, right: 18, height: "0.5px", background: cfg.line }} />
      <div style={{ position: "absolute", bottom: 11, right: 14, fontSize: 13, color: cfg.accent, opacity: 0.38, fontWeight: "bold" }}>{cfg.bottomIcon}</div>
    </div>
  );
}

/* ── animated title with shimmer ── */
function HeroTitle() {
  return (
    <h1 style={{
      margin: "0 0 5px 0", fontSize: 36, fontWeight: 900,
      letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.05,
      background: "linear-gradient(90deg, #d060c8 0%, #e870b0 25%, #b860e8 55%, #78b8e8 100%)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      position: "relative", display: "inline-block",
      filter: "drop-shadow(0 2px 8px rgba(220,100,200,0.25))",
    }}>Welcome to Orbit
      <span style={{
        position: "absolute", top: -4, right: -18,
        fontSize: 16, WebkitTextFillColor: "initial", color: "#ffcc44",
        filter: "drop-shadow(0 1px 3px rgba(255,180,0,0.5))",
        animation: "starPulse 2s ease-in-out infinite",
      }}>👑</span>
    </h1>
  );
}

import { gsap } from "gsap";

export default function PastelApp({ children }) {
  const navRef = useRef(null), sidebarRef = useRef(null), heroRef = useRef(null);
  const c0 = useRef(null), c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const { users, selectedUser, setSelectedUser } = useChatStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ctx = gsap.context(() => {
      const cards = [c0, c1, c2, c3].map(r => r.current).filter(Boolean);
      const nav = navRef.current;
      const sidebar = sidebarRef.current;
      const hero = heroRef.current;

      if (nav) gsap.set(nav, { opacity: 0, y: -20 });
      if (sidebar) gsap.set(sidebar, { opacity: 0, x: -24 });
      if (hero) gsap.set(hero, { opacity: 0, y: 16 });
      if (cards.length > 0) gsap.set(cards, { opacity: 0, y: 22, scale: 0.95 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (nav) tl.to(nav, { opacity: 1, y: 0, duration: 0.55 });
      if (sidebar) tl.to(sidebar, { opacity: 1, x: 0, duration: 0.5 }, "-=0.35");
      if (hero) tl.to(hero, { opacity: 1, y: 0, duration: 0.45 }, "-=0.3");
      if (cards.length > 0) {
        tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.09 }, "-=0.25");
      }

      cards.forEach((c, i) => {
        gsap.to(c, { y: i % 2 === 0 ? -5 : 5, duration: 2.8 + i * 0.25, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.5 });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      fontFamily: "'Nunito', 'Varela Round', system-ui, sans-serif",
      background: "linear-gradient(145deg, #ffd4ee 0%, #f8c0dc 8%, #f0ccf8 18%, #d0d4f8 32%, #bce4f8 46%, #c0eee8 62%, #ccf0d8 78%, #d8f4e4 100%)",
      cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='3' fill='%23ff88cc' opacity='0.8'/%3E%3C/svg%3E\") 12 12, auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes starPulse {
          0%,100%{ opacity:0.45; transform:scale(1) rotate(0deg); }
          50%{ opacity:0.9; transform:scale(1.18) rotate(14deg); }
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.38;} }
        @keyframes shimmer {
          0%{ left:-60%; }
          100%{ left:130%; }
        }
        @keyframes sparkFly {
          0%  { transform:translate(0,0) scale(1); opacity:1; }
          100%{ transform:translate(var(--dx),var(--dy)) scale(0); opacity:0; }
        }
        @keyframes float {
          0%,100%{ transform:translateY(0); }
          50%{ transform:translateY(-6px); }
        }
        *{ box-sizing:border-box; }
        button:focus{ outline:none; }
        ::-webkit-scrollbar{ width:4px; }
        ::-webkit-scrollbar-thumb{ background:rgba(255,150,200,0.35); border-radius:99px; }
        ::-webkit-scrollbar-thumb{ background:rgba(255,150,200,0.35); border-radius:99px; }

        /* ── Pastel Dream Chat Theme ── */
        .pastel-chat-env .nexus-chat-container {
          background: rgba(255,255,255,0.6) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 30px !important; /* heavy border radius */
          overflow: hidden !important;
          border: 1px solid rgba(255,255,255,0.8) !important;
          box-shadow: 0 10px 40px rgba(255,150,200,0.1) !important;
        }
        .pastel-chat-env .nxc-messages {
          background-color: transparent !important;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(200, 180, 255, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, rgba(180, 255, 200, 0.4) 0%, transparent 60%) !important;
        }
        .pastel-chat-env .nexus-chat-header { 
          background: rgba(255,255,255,0.4) !important; 
          border-bottom: 1px solid rgba(255,183,178,0.4) !important;
          backdrop-filter: blur(14px) !important;
          color: #8b5a2b !important; /* Coffee brown */
        }
        .pastel-chat-env .nexus-chat-header .nxc-name { color: #8b5a2b !important; font-weight: 800 !important; }
        .pastel-chat-env .nxc-utility-group, .pastel-chat-env .nxc-telemetry-capsule {
          background: transparent !important; border: none !important; box-shadow: none !important;
          color: #8b5a2b !important;
        }
        /* Claymorphic Buttons */
        .pastel-chat-env .nxc-hbtn, .pastel-chat-env .nxc-aero-btn {
          background: rgba(255,255,255,0.85) !important;
          border-radius: 50% !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.3), -4px -4px 10px rgba(255,255,255,0.8), inset 2px 2px 4px rgba(255,255,255,1), inset -2px -2px 4px rgba(255,183,178,0.15) !important;
          color: #8b5a2b !important; 
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .pastel-chat-env .nxc-hbtn:hover, .pastel-chat-env .nxc-aero-btn:hover {
          transform: scale(1.15) !important; /* Popping */
          box-shadow: 6px 6px 12px rgba(255,183,178,0.35), -6px -6px 12px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,1), inset -2px -2px 4px rgba(255,183,178,0.15) !important;
        }
        .pastel-chat-env .nxc-signal-bars .nxc-bar,
        .pastel-chat-env .text-\[\#5dcaa5\] {
          background-color: #8b5a2b !important; /* Using coffee brown to keep grounded */
          color: #8b5a2b !important;
          text-shadow: none !important;
        }
        .pastel-chat-env .bg-white\\/20 { display: none !important; } /* Clear out white line dividers from general utility group layout */
        
        .pastel-chat-env .nxi-shell {
          background: rgba(255,255,255,0.4) !important;
          border-top: 1px solid rgba(255,183,178,0.4) !important;
          backdrop-filter: blur(14px) !important;
        }
        .pastel-chat-env .nxi-textarea {
          background: rgba(255,255,255,0.6) !important;
          border: 1px solid rgba(255,183,178,0.5) !important;
          color: #8b5a2b !important;
          border-radius: 18px !important;
        }
        .pastel-chat-env .nxi-textarea:focus {
          border-color: #ffb7b2 !important; box-shadow: 0 0 10px rgba(255,183,178,0.5) !important;
        }
        .pastel-chat-env .nxi-send.ready {
          background: rgba(255,255,255,0.85) !important;
          color: #8b5a2b !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.3), inset 2px 2px 4px rgba(255,255,255,1) !important;
          border-radius: 50% !important;
        }
        .pastel-chat-env .nxi-tool-btn, .pastel-chat-env .nxi-mic { color: #8b5a2b !important; }

        /* Bubbles */
        .pastel-chat-env .msg-bubble-mine { 
          background: rgba(255,255,255,0.8) !important; 
          border: 1px solid rgba(255,183,178,0.6) !important; 
          color: #8b5a2b !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.2) !important;
        }
        .pastel-chat-env .msg-bubble-other { 
          background: rgba(255,255,255,0.5) !important; 
          border: 1px solid rgba(255,255,255,0.8) !important; 
          color: #8b5a2b !important;
        }
      `}</style>

      <SparkleClick />
      <BgClouds />
      <Floaties />
      <TopNav navRef={navRef} />

      <div style={{ position: "absolute", top: 50, left: 0, right: 0, bottom: 0, display: "flex" }}>
        <Sidebar 
          sidebarRef={sidebarRef} 
          nexuses={nexuses}
          isNexusesLoading={isNexusesLoading}
          setSelectedNexus={(n) => { setSelectedNexus(n); setSelectedUser(null); }}
          users={users || []}
          setSelectedUser={(u) => { setSelectedUser(u); setSelectedNexus(null); }}
          nexusUnread={nexusUnread || {}}
        />

        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {nexusActionView && (
            <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
              <NexusActionOverlay
                mode={nexusActionView}
                onClose={() => setNexusActionView(null)}
                inline={true}
              />
            </div>
          )}
          <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
            {children ? children : nexusActionView ? (
              <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
                <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
              </div>
            ) : nexusSelected ? (
              <div className="pastel-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
                <UniversalChatContainer type="nexus" />
              </div>
            ) : selectedUser ? (
              <div className="pastel-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
                <UniversalChatContainer type="dm" />
              </div>
            ) : (
              <div style={{ padding: "20px 26px 18px 26px", height: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                {/* Hero */}
                <div ref={heroRef}>
                  <StatusPill />
                  <HeroTitle />
                  <p style={{ margin: 0, fontSize: 11.5, color: "rgba(170,100,150,0.7)", letterSpacing: "0.02em" }}>
                    Choose a pathway to begin your mission. ✨
                  </p>
                </div>

                {/* Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
                  <SpotifyCard cardRef={c0} />
                  <FeatureCard cfg={CARDS[0]} cardRef={c1} />
                  <FeatureCard cfg={CARDS[1]} cardRef={c2} />
                  <FeatureCard cfg={CARDS[2]} cardRef={c3} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
