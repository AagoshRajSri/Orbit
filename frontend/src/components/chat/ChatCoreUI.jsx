import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import MessageStatusRing from "./MessageStatusRing";
import { PixelAvatarBadge } from "./PixelAvatar/PixelAvatarBadge.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// FONTS (add to index.html):
// <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Rajdhani:wght@300;400;600;700&family=Orbitron:wght@400;600;700;800;900&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
// GSAP: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
//  THEME TOKENS
// ══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  vampire: {
    id: "vampire", label: "DARK — VAMPIRE", name: "Blood Coven",
    font: "'Cinzel', serif", fontBody: "'Cinzel', serif",
    bg: "#060000", panel: "#0a0000", header: "#0e0000",
    border: "#2d0000", borderAcc: "#660000",
    acc: "#cc0000", acc2: "#ff1a1a", acc3: "#800000",
    txt: "#e8d5d5", txt2: "#a07070", txt3: "#5c2020",
    avatar: "#1a0000", avTxt: "#cc0000",
    msgIn: "#110000", msgOut: "#230000", msgOutBrd: "#550000",
    input: "#0a0000", inputBrd: "#2d0000",
    send: "#cc0000", sendTxt: "#fff",
    status: "#cc2222", toolC: "#5c2020",
    sidebar: "#050000", sidebarItem: "#0a0000",
    glow: "rgba(204,0,0,0.35)", glow2: "rgba(204,0,0,0.12)",
    emojiPnl: "#0e0000", grid: "rgba(204,0,0,0.04)",
    wave: "#cc0000", tag: "#1a0000", tagBrd: "#660000",
    scrollbar: "#3d0000", selection: "rgba(204,0,0,0.3)",
    decorator: "🩸", decoratorBig: "🦇",
    noise: true,
    headerGrad: "linear-gradient(180deg,#110000,#0a0000)",
    msgGrad: "linear-gradient(135deg,#1a0000,#0d0000)",
    particles: { color: "#cc0000", count: 25, speed: 0.25 },
    reactions: ["🩸","🦇","💀","🌹","🔮","⚰️"],
  },
  premium: {
    id: "premium", label: "LIGHT — PREMIUM", name: "Aurum Private",
    font: "'Cormorant Garamond', serif", fontBody: "'Cormorant Garamond', serif",
    bg: "#f7f4ee", panel: "#ffffff", header: "#ffffff",
    border: "#e2dace", borderAcc: "#c8a84b",
    acc: "#8b6914", acc2: "#c8a84b", acc3: "#5a4209",
    txt: "#1a140a", txt2: "#6b5a3a", txt3: "#c8b898",
    avatar: "#f5edd8", avTxt: "#8b6914",
    msgIn: "#ffffff", msgOut: "#fdf4dd", msgOutBrd: "#dab84a",
    input: "#ffffff", inputBrd: "#e2dace",
    send: "#8b6914", sendTxt: "#fff",
    status: "#2d7a4f", toolC: "#b8a882",
    sidebar: "#f2ede3", sidebarItem: "#ffffff",
    glow: "rgba(139,105,20,0.15)", glow2: "rgba(139,105,20,0.06)",
    emojiPnl: "#fff", grid: "rgba(139,105,20,0.04)",
    wave: "#8b6914", tag: "#fdf4dd", tagBrd: "#dab84a",
    scrollbar: "#ddd0b0", selection: "rgba(200,168,75,0.25)",
    decorator: "✦", decoratorBig: "⚜️",
    noise: false,
    headerGrad: "linear-gradient(180deg,#ffffff,#faf7f0)",
    msgGrad: "linear-gradient(135deg,#fffbf0,#fdf4dd)",
    particles: { color: "#c8a84b", count: 12, speed: 0.15 },
    reactions: ["✨","💎","👑","🥂","🌹","⚜️"],
  },
  amoled: {
    id: "amoled", label: "AMOLED — LUXURY", name: "Vault Obsidian",
    font: "'Playfair Display', serif", fontBody: "'Playfair Display', serif",
    bg: "#000000", panel: "#000000", header: "#020100",
    border: "#150f00", borderAcc: "#5a4200",
    acc: "#c9a84c", acc2: "#e8c96a", acc3: "#7a6020",
    txt: "#f0e6c0", txt2: "#8a7440", txt3: "#3d3010",
    avatar: "#0f0c00", avTxt: "#c9a84c",
    msgIn: "#060400", msgOut: "#0e0a00", msgOutBrd: "#5a4200",
    input: "#040300", inputBrd: "#1a1400",
    send: "#c9a84c", sendTxt: "#000",
    status: "#c9a84c", toolC: "#3d3010",
    sidebar: "#010100", sidebarItem: "#060400",
    glow: "rgba(201,168,76,0.3)", glow2: "rgba(201,168,76,0.08)",
    emojiPnl: "#060400", grid: "rgba(201,168,76,0.025)",
    wave: "#c9a84c", tag: "#0e0a00", tagBrd: "#5a4200",
    scrollbar: "#2a2000", selection: "rgba(201,168,76,0.2)",
    decorator: "◆", decoratorBig: "💎",
    noise: true,
    headerGrad: "linear-gradient(180deg,#0a0700,#000000)",
    msgGrad: "linear-gradient(135deg,#120e00,#080500)",
    particles: { color: "#c9a84c", count: 20, speed: 0.18 },
    reactions: ["💎","👑","🥇","✨","🔑","🏆"],
  },
  cyberpunk: {
    id: "cyberpunk", label: "NEON — CYBERPUNK", name: "GHOST_NET",
    font: "'Rajdhani', sans-serif", fontBody: "'Rajdhani', sans-serif",
    bg: "#04000c", panel: "#080012", header: "#0a0018",
    border: "#2d0048", borderAcc: "#8b00cc",
    acc: "#e879f9", acc2: "#a855f7", acc3: "#6d00aa",
    txt: "#f5e6ff", txt2: "#b06acc", txt3: "#5a2080",
    avatar: "#160028", avTxt: "#e879f9",
    msgIn: "#0c001e", msgOut: "#180030", msgOutBrd: "#7b22b0",
    input: "#080015", inputBrd: "#2d0048",
    send: "#e879f9", sendTxt: "#04000c",
    status: "#4ade80", toolC: "#5a2080",
    sidebar: "#030009", sidebarItem: "#0a0018",
    glow: "rgba(232,121,249,0.45)", glow2: "rgba(168,85,247,0.15)",
    emojiPnl: "#0a0018", grid: "rgba(168,85,247,0.05)",
    wave: "#e879f9", tag: "#180030", tagBrd: "#7b22b0",
    scrollbar: "#3d0060", selection: "rgba(232,121,249,0.2)",
    decorator: "⚡", decoratorBig: "🔮",
    noise: true,
    headerGrad: "linear-gradient(180deg,#0f0025,#080015)",
    msgGrad: "linear-gradient(135deg,#1e0040,#0c001e)",
    particles: { color: "#e879f9", count: 30, speed: 0.3 },
    reactions: ["⚡","🔮","💜","🕹️","🌐","☠️"],
  },
  gamer: {
    id: "gamer", label: "GAMER — OVERDRIVE", name: "SQUAD_NEXUS",
    font: "'Orbitron', sans-serif", fontBody: "'Orbitron', sans-serif",
    bg: "#010308", panel: "#020409", header: "#030509",
    border: "#0a1e00", borderAcc: "#1a6600",
    acc: "#00ff41", acc2: "#ff3131", acc3: "#007a20",
    txt: "#d4ffdc", txt2: "#5aaa6a", txt3: "#1a4020",
    avatar: "#001808", avTxt: "#00ff41",
    msgIn: "#030c06", msgOut: "#081c00", msgOutBrd: "#155500",
    input: "#020409", inputBrd: "#0a1e00",
    send: "#00ff41", sendTxt: "#010308",
    status: "#00ff41", toolC: "#1a4020",
    sidebar: "#010204", sidebarItem: "#030509",
    glow: "rgba(0,255,65,0.4)", glow2: "rgba(0,255,65,0.1)",
    emojiPnl: "#030c06", grid: "rgba(0,255,65,0.04)",
    wave: "#00ff41", tag: "#081c00", tagBrd: "#155500",
    scrollbar: "#0d2000", selection: "rgba(0,255,65,0.2)",
    decorator: "◈", decoratorBig: "🎮",
    noise: true,
    headerGrad: "linear-gradient(180deg,#040a06,#020409)",
    msgGrad: "linear-gradient(135deg,#0d1f00,#040c06)",
    particles: { color: "#00ff41", count: 28, speed: 0.28 },
    reactions: ["🔥","💀","🎮","⚡","🏆","🎯"],
  },
  barbie: {
    id: "barbie", label: "PASTEL — DREAMCORE", name: "Dreamland ✨",
    font: "'Quicksand', sans-serif", fontBody: "'Quicksand', sans-serif",
    bg: "#fff0f8", panel: "#ffffff", header: "#ffffff",
    border: "#f5c0e4", borderAcc: "#ff69b4",
    acc: "#ff69b4", acc2: "#7ec8e3", acc3: "#e040a0",
    txt: "#3d1a2e", txt2: "#a05080", txt3: "#e8b8d5",
    avatar: "#ffd6ec", avTxt: "#ff69b4",
    msgIn: "#ffffff", msgOut: "#ffe4f4", msgOutBrd: "#ffaadb",
    input: "#fff8fd", inputBrd: "#f5c0e4",
    send: "#ff69b4", sendTxt: "#fff",
    status: "#4dd9a0", toolC: "#dda8c8",
    sidebar: "#fff5fc", sidebarItem: "#ffffff",
    glow: "rgba(255,105,180,0.3)", glow2: "rgba(255,105,180,0.1)",
    emojiPnl: "#fff", grid: "rgba(255,105,180,0.06)",
    wave: "#ff69b4", tag: "#ffe4f4", tagBrd: "#ffaadb",
    scrollbar: "#f5c0e4", selection: "rgba(255,105,180,0.2)",
    decorator: "✿", decoratorBig: "🌸",
    noise: false,
    headerGrad: "linear-gradient(180deg,#ffffff,#fff8fd)",
    msgGrad: "linear-gradient(135deg,#fff0f8,#ffe4f4)",
    particles: { color: "#ff69b4", count: 22, speed: 0.2 },
    reactions: ["💖","✨","🌸","💅","🦄","🍭"],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  INITIAL GROUP STATE
// ══════════════════════════════════════════════════════════════════════════════
const makeGroupState = (themeId) => ({
  name: THEMES[themeId].name,
  description: {
    vampire: "A secret gathering of the night-bound. Speak only in shadows.",
    premium: "Executive communications channel. Discretion is paramount.",
    amoled: "Zero-emission encrypted vault. Absolute privacy guaranteed.",
    cyberpunk: "GHOST NETWORK :: Unauthorized access will be flatlined.",
    gamer: "RANKED SQUAD CHAT :: GG OR GET REKT :: NO CAMPING",
    barbie: "✨ The most iconic group in the multiverse. We slay daily 💅",
  }[themeId],
  icon: THEMES[themeId].decoratorBig,
  privacy: "private",
  notifications: "all",
  slowMode: 0,
  maxMembers: 50,
  disappearingMessages: 0,
  pinnedMsg: {
    vampire: "🩸 Blood moon ritual — tonight at midnight. Coven tower.",
    premium: "📋 Board meeting rescheduled: Thursday 3PM GMT. Agenda attached.",
    amoled: "💎 Vault Tier III activated. Unlimited transfers. New cipher key issued.",
    cyberpunk: "⚠️ CORP ICE detected on Sector 7. Avoid subnet 192.168.6.x",
    gamer: "🎮 TOURNAMENT: Saturday 8PM — Register in #brackets before Friday",
    barbie: "🌸 Sunday brunch at Dream Café! Drop your RSVP below 💅",
  }[themeId],
  roles: ["Owner","Admin","Moderator","Member"],
  members: [
    { id: 1, name: { vampire:"Countess Lyra", premium:"Victoria Ashford", amoled:"Cipher Zero", cyberpunk:"Ghost_IX", gamer:"APEX_K1LL3R", barbie:"Stacie ✨" }[themeId], role: "Owner", status: "online", muted: false, banned: false, joined: "2024-01-15" },
    { id: 2, name: { vampire:"Lord Voss", premium:"Sebastian Crane", amoled:"Phantom Byte", cyberpunk:"Razor_Net", gamer:"NightHawk99", barbie:"Midge 💕" }[themeId], role: "Admin", status: "online", muted: false, banned: false, joined: "2024-02-01" },
    { id: 3, name: { vampire:"Shadow_88", premium:"Eleanor Webb", amoled:"Null Vector", cyberpunk:"ICE_Breaker", gamer:"FragMaster", barbie:"Christie 🌸" }[themeId], role: "Moderator", status: "away", muted: false, banned: false, joined: "2024-02-14" },
    { id: 4, name: { vampire:"Dusk Rider", premium:"James Hartley", amoled:"Dark Matter", cyberpunk:"Syn_Th", gamer:"LaserKing", barbie:"Teresa 💖" }[themeId], role: "Member", status: "offline", muted: false, banned: false, joined: "2024-03-01" },
    { id: 5, name: { vampire:"Midnight Echo", premium:"Clara Fontaine", amoled:"Binary Ghost", cyberpunk:"Neon_Wraith", gamer:"PixelSlayer", barbie:"Francie 🦄" }[themeId], role: "Member", status: "online", muted: true, banned: false, joined: "2024-03-10" },
    { id: 6, name: { vampire:"Red Veil", premium:"Thomas Aldworth", amoled:"Static Noise", cyberpunk:"Volt_Hz", gamer:"BulletStorm", barbie:"Skipper 🌈" }[themeId], role: "Member", status: "offline", muted: false, banned: false, joined: "2024-04-01" },
  ],
  media: [
    { type: "image", name: "ritual.jpg", size: "2.4 MB" },
    { type: "file", name: "manifest.pdf", size: "1.1 MB" },
    { type: "image", name: "coven_map.png", size: "3.8 MB" },
    { type: "file", name: "cipher_key.zip", size: "0.3 MB" },
  ],
  links: ["https://nexuschat.app/coven", "https://wiki.coven.net/rituals"],
  tags: { vampire:["#coven","#ritual","#night"], premium:["#executive","#private","#aurum"], amoled:["#vault","#encrypted","#zero-trust"], cyberpunk:["#ghostnet","#hack","#neon"], gamer:["#ranked","#squad","#gg"], barbie:["#iconic","#slay","#dream"] }[themeId],
  color: THEMES[themeId].acc,
  inviteLink: `nexus.app/join/${themeId}-${Math.random().toString(36).slice(2,8)}`,
  createdAt: "2024-01-01",
  messageCount: 4280,
  voiceActive: false,
});

const SAMPLE_MSGS = (themeId) => [
  { id: 1, from: THEMES[themeId].name, uid: 1, text: { vampire:"Welcome to the coven. The blood moon rises tonight.", premium:"Good afternoon. The quarterly portfolio has been reviewed.", amoled:"Your private vault is now active. Authentication confirmed.", cyberpunk:"JACK IN. Neural link stable. ICE at 2% — we're clear.", gamer:"SERVER ONLINE. Squad assembled. Ready to drop.", barbie:"Omg you're finally here!! We've been waiting bestie 💕" }[themeId], out:false, time:"23:14", reactions:{ [THEMES[themeId].reactions[0]]:3 } },
  { id: 2, from:"You", uid:0, text:{ vampire:"Transmission received. Blood oath confirmed. I arrive at midnight.", premium:"Kindly prepare the executive brief. I shall review before Thursday.", amoled:"Authenticate with gold key. Open the Zurich portfolio.", cyberpunk:"Running ghost protocol now. Firewall at 8%. Extraction ready.", gamer:"READY. ENGAGE. Loading respawn configs.", barbie:"YASS QUEEN! Let's slay today bestie!! ✨💅" }[themeId], out:true, time:"23:15" },
  { id: 3, from:{ vampire:"Lord Voss", premium:"Victoria Ashford", amoled:"Cipher Zero", cyberpunk:"Ghost_IX", gamer:"APEX_K1LL3R", barbie:"Stacie ✨" }[themeId], uid:2, text:{ vampire:"The ritual chamber has been prepared. Obsidian chalice awaits.", premium:"Documents are ready. Encoded with the standard cipher.", amoled:"Portfolio updated. Gains at 14.7% this quarter.", cyberpunk:"DATA EXTRACTED. Corp ICE incoming — initiate flatline protocol.", gamer:"GG. MATCH FOUND — 4v4 RANKED. First pick goes.", barbie:"Pink lattes at Dream Café in 10 mins? ☕🌸" }[themeId], out:false, time:"23:16", reactions:{ [THEMES[themeId].reactions[1]]:1, [THEMES[themeId].reactions[2]]:2 } },
];

// ══════════════════════════════════════════════════════════════════════════════
//  GLOBAL CSS
// ══════════════════════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
@keyframes typingBounce {
  0%,80%,100%{transform:translateY(0);opacity:.35}
  40%{transform:translateY(-7px);opacity:1}
}
@keyframes recPulse {
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.6;transform:scale(1.15)}
}
@keyframes waveBar {
  0%,100%{height:4px}
  50%{height:var(--h,20px)}
}
@keyframes fadeUp {
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes fadeIn {
  from{opacity:0}
  to{opacity:1}
}
@keyframes slideInRight {
  from{opacity:0;transform:translateX(30px)}
  to{opacity:1;transform:translateX(0)}
}
@keyframes slideInLeft {
  from{opacity:0;transform:translateX(-30px)}
  to{opacity:1;transform:translateX(0)}
}
@keyframes glowPulse {
  0%,100%{opacity:.6}
  50%{opacity:1}
}
@keyframes scanline {
  0%{transform:translateY(-100%)}
  100%{transform:translateY(100vh)}
}
@keyframes float {
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-6px)}
}
@keyframes borderGlow {
  0%,100%{box-shadow:0 0 5px var(--acc)}
  50%{box-shadow:0 0 20px var(--acc),0 0 40px var(--acc)}
}
@keyframes shimmer {
  0%{background-position:-200% center}
  100%{background-position:200% center}
}
@keyframes popIn {
  0%{opacity:0;transform:scale(.85) translateY(8px)}
  70%{transform:scale(1.04) translateY(-2px)}
  100%{opacity:1;transform:scale(1) translateY(0)}
}
@keyframes notifSlide {
  0%{transform:translateY(-60px);opacity:0}
  15%,85%{transform:translateY(0);opacity:1}
  100%{transform:translateY(-60px);opacity:0}
}
* { box-sizing:border-box; margin:0; padding:0; }
::-webkit-scrollbar { width:5px; height:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { border-radius:6px; }
::selection { background: var(--sel,rgba(255,255,255,0.2)); }
`;

// ══════════════════════════════════════════════════════════════════════════════
//  ICON SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
const Ico = ({ d, size=18, stroke="currentColor", fill="none", sw=1.8, style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {(Array.isArray(d)?d:[d]).map((p,i)=><path key={i} d={p}/>)}
  </svg>
);

const I = {
  send:"M22 2L11 13M22 2L15 22L11 13L2 9L22 2",
  mic:["M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z","M19 10v2a7 7 0 01-14 0v-2","M12 19v4M8 23h8"],
  attach:"M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  emoji:["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z","M8 14s1.5 2 4 2 4-2 4-2","M9 9h.01M15 9h.01"],
  gif:["M10 9H6v6h4","M14 9h4","M14 12h3","M14 15v-6"],
  sticker:"M12 2a10 10 0 100 20 10 10 0 000-20zM8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32",
  img:["M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z","M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z","M21 15l-5-5L5 21"],
  phone:"M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .95h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  video:["M23 7l-7 5 7 5V7z","M1 5h13a2 2 0 012 2v10a2 2 0 01-2 2H1a2 2 0 01-2-2V7a2 2 0 012-2z"],
  search:["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"],
  x:"M18 6L6 18M6 6l12 12",
  more:"M12 5v.01M12 12v.01M12 19v.01",
  pin:["M12 2l3 6 6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1 3-6z"],
  check:["M20 6L9 17l-5-5","M15 6l-4 4"],
  bell:["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"],
  download:["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"],
  edit:["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash:["M3 6h18","M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6","M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2","M10 11v6","M14 11v6"],
  ban:"M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  shield:["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  crown:"M2 20h20M5 20V10l7-6 7 6v10",
  users:["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75","M9 7a4 4 0 100 8 4 4 0 000-8z"],
  link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  lock:["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"],
  globe:"M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  clock:["M12 22a10 10 0 100-20 10 10 0 000 20z","M12 6v6l4 2"],
  tag:["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z","M7 7h.01"],
  hash:"M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  grid:"M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  copy:"M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4a2 2 0 000 4h8a2 2 0 000-4",
  back:"M19 12H5M12 5l-7 7 7 7",
  up:"M5 15l7-7 7 7",
  settings:["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  mic2:"M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z",
  endCall:"M23 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 1 1 0 01-.33-.18 19.5 19.5 0 01-5-5A19.79 19.79 0 013.7 5.2 2 2 0 015.68 3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.66 10.9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0123 16.92z",
};

// ══════════════════════════════════════════════════════════════════════════════
//  PARTICLE CANVAS
// ══════════════════════════════════════════════════════════════════════════════
function ParticleCanvas({ t, style={} }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({length: t.particles.count}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: 0.6+Math.random()*1.8,
      vx:(Math.random()-.5)*t.particles.speed, vy:(Math.random()-.5)*t.particles.speed,
      a: .15+Math.random()*.4,
    }));
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>{
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        const hex = Math.floor(p.a*255).toString(16).padStart(2,"0");
        ctx.fillStyle = t.particles.color+hex; ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, [t]);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, pointerEvents:"none", borderRadius:"inherit", ...style }} />;
}

// ══════════════════════════════════════════════════════════════════════════════
//  WAVE VOICE
// ══════════════════════════════════════════════════════════════════════════════
function Wave({ color, active, bars=28, h=36 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:2,height:h}}>
      {Array.from({length:bars}).map((_,i)=>(
        <div key={i} style={{
          width:3, borderRadius:3, background:color,
          opacity: active?.9:.25,
          height: active?undefined:4,
          animationName: active?"waveBar":"none",
          animationDuration:`${.5+(i%7)*.07}s`,
          animationTimingFunction:"ease-in-out",
          animationIterationCount:"infinite",
          animationDirection:"alternate",
          animationDelay:`${i*.03}s`,
          "--h":`${10+Math.abs(Math.sin(i*.7))*18}px`,
        }}/>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TYPING INDICATOR
// ══════════════════════════════════════════════════════════════════════════════
function Typing({t}) {
  return (
    <div style={{display:"flex",gap:3,alignItems:"center",padding:"9px 13px",borderRadius:14,borderBottomLeftRadius:3,background:t.msgIn,border:`1px solid ${t.border}`,width:58,animation:"fadeUp .25s ease"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:6,height:6,borderRadius:"50%",background:t.acc,animationName:"typingBounce",animationDuration:"1.2s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",animationDelay:`${i*.2}s`}}/>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION TOAST
// ══════════════════════════════════════════════════════════════════════════════
function Toast({t,msg,onDone}) {
  useEffect(()=>{const ti=setTimeout(onDone,3500);return()=>clearTimeout(ti);},[]);
  return createPortal(
    <div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",zIndex:99999,background:t.header,border:`1.5px solid ${t.acc}`,borderRadius:12,padding:"12px 24px",color:t.txt,fontFamily:t.font,fontSize:14,boxShadow:`0 8px 32px ${t.glow}`,animation:"notifSlide 3.5s ease forwards",whiteSpace:"nowrap"}}>
      <span style={{color:t.acc,marginRight:8}}>✦</span>{msg}
    </div>,
    document.body
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CALL OVERLAY
// ══════════════════════════════════════════════════════════════════════════════
function CallOverlay({t,type,onEnd}) {
  const [sec,setSec]=useState(0);
  const [muted,setMuted]=useState(false);
  const [camOff,setCamOff]=useState(false);
  useEffect(()=>{ const ti=setInterval(()=>setSec(s=>s+1),1000); return()=>clearInterval(ti); },[]);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  return (
    <div style={{position:"fixed",inset:0,zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.9)",backdropFilter:"blur(12px)",animation:"fadeIn .25s ease"}}>
      <div style={{position:"relative",background:t.panel,border:`1.5px solid ${t.borderAcc}`,borderRadius:24,padding:40,width:400,textAlign:"center",boxShadow:`0 0 80px ${t.glow}`,fontFamily:t.font,animation:"popIn .35s ease",overflow:"hidden"}}>
        <ParticleCanvas t={t}/>
        <div style={{position:"relative",zIndex:1}}>
          {type==="video"&&(
            <div style={{background:t.msgIn,border:`1px solid ${t.border}`,borderRadius:14,height:140,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",color:t.txt2,fontSize:13,letterSpacing:".05em"}}>
              {camOff?"📷 Camera off":`📹 ${t.decoratorBig} Live`}
            </div>
          )}
          <div style={{width:80,height:80,borderRadius:"50%",background:t.avatar,border:`3px solid ${t.acc}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:`0 0 30px ${t.glow}`,fontFamily:t.font}}>{t.decoratorBig}</div>
          <div style={{color:t.txt,fontSize:20,fontWeight:700,marginBottom:4}}>{t.name}</div>
          <div style={{color:t.txt2,fontSize:13,marginBottom:6,letterSpacing:".05em"}}>{type==="video"?"Video Call":"Voice Call"}</div>
          <div style={{color:t.acc,fontSize:28,fontWeight:800,letterSpacing:4,marginBottom:24,fontVariantNumeric:"tabular-nums"}}>{fmt(sec)}</div>
          <Wave color={t.wave} active={!muted} bars={32} h={40}/>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:24}}>
            <Btn3D style={{width:52,height:52,borderRadius:"50%",border:`1px solid ${t.border}`,background:muted?t.acc:t.msgIn,color:muted?t.sendTxt:t.txt}} onClick={()=>setMuted(!muted)}>{muted?"🔇":"🎙️"}</Btn3D>
            <Btn3D style={{width:64,height:64,borderRadius:"50%",background:"#cc2200",color:"#fff",border:"none",boxShadow:"0 4px 24px rgba(200,34,0,.6)"}} onClick={onEnd}><Ico d={I.endCall} size={22} stroke="#fff"/></Btn3D>
            {type==="video"&&<Btn3D style={{width:52,height:52,borderRadius:"50%",border:`1px solid ${t.border}`,background:camOff?t.acc:t.msgIn,color:camOff?t.sendTxt:t.txt}} onClick={()=>setCamOff(!camOff)}>{camOff?"📷":"📹"}</Btn3D>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  HELPER: BUTTON WITH PRESS FEEL
// ══════════════════════════════════════════════════════════════════════════════
function Btn3D({children,onClick,style={},title=""}) {
  const [pr,setPr]=useState(false);
  return (
    <button title={title} onClick={onClick} onMouseDown={()=>setPr(true)} onMouseUp={()=>setPr(false)} onMouseLeave={()=>setPr(false)}
      style={{cursor:"pointer",transition:"transform .1s,box-shadow .1s",transform:pr?"scale(.94)":"scale(1)",display:"flex",alignItems:"center",justifyContent:"center",...style}}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOOLBAR ICON BTN
// ══════════════════════════════════════════════════════════════════════════════
function TBtn({t,d,label,active,onClick,sz=20}) {
  const [hov,setHov]=useState(false);
  return (
    <button title={label} onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:36,height:36,borderRadius:9,border:"none",background:active?t.acc+"28":hov?t.glow2:"transparent",color:active?t.acc:hov?t.acc:t.toolC,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
      <Ico d={d} size={sz} stroke="currentColor"/>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  EMOJI PICKER OVERLAY (for any-emoji reactions)
// ══════════════════════════════════════════════════════════════════════════════
function EmojiPickerOverlay({ t, onSelect, onClose, isMe }) {
  const EMOJIS = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘"
  ];
  return (
    <div style={{ 
      position: "absolute", bottom: "100%", 
      [isMe ? "right" : "left"]: 0, 
      marginBottom: 10, zIndex: 100, background: t.header+"ee", 
      backdropFilter: "blur(16px)", border: `1px solid ${t.border}`, 
      borderRadius: 16, padding: 12, width: 220, 
      boxShadow: `0 12px 40px rgba(0,0,0,.6)`, animation: "popIn .2s ease", 
      display: "flex", flexDirection: "column", gap: 8 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${t.border}44`, paddingBottom: 6 }}>
        <span style={{ fontSize: 10, color: t.txt2, fontWeight: 800, fontFamily: t.font, textTransform: "uppercase", letterSpacing: "0.1em" }}>React</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.txt2, cursor: "pointer", display: "flex" }}><Ico d={I.x} size={14} stroke="currentColor" /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, maxHeight: 180, overflowY: "auto", paddingRight: 4, scrollbarWidth: "thin" }}>
        {EMOJIS.map(e => (
          <span key={e} onClick={() => { onSelect(e); onClose(); }} style={{ fontSize: 22, cursor: "pointer", padding: 4, borderRadius: 8, transition: "background .15s", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={el => el.currentTarget.style.background = t.acc + "33"}
            onMouseLeave={el => el.currentTarget.style.background = "transparent"}>{e}</span>
        ))}
      </div>
    </div>
  );
}

const GLOWS = {
  sending:   "radial-gradient(ellipse at 100% 100%, rgba(180,180,210,0.06) 0%, transparent 80%)",
  delivered: "radial-gradient(ellipse at 100% 100%, rgba(80,120,255,0.05) 0%, transparent 80%)",
  read:      "radial-gradient(ellipse at 100% 100%, rgba(16,217,138,0.06) 0%, transparent 80%)",
  failed:    "radial-gradient(ellipse at 100% 100%, rgba(248,83,83,0.08) 0%, transparent 80%)",
};

// ══════════════════════════════════════════════════════════════════════════════
//  MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════
export const MsgBubble = memo(function MsgBubble({msg,t,onReact,isMe}) {
  const [hov,setHov]=useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",marginBottom:8,animation:"fadeUp .28s ease", position: "relative"}}>
      {!isMe&&<div style={{fontSize:11,color:t.txt2,marginBottom:4,marginLeft:14,fontFamily:t.font,fontWeight:600,letterSpacing:".04em"}}>{msg.from}</div>}
      <div 
        onMouseEnter={()=>{setHov(true)}} 
        onMouseLeave={()=>{setHov(false); setShowPicker(false);}}
        style={{position:"relative"}}
      >
        {hov&&(
          <div style={{position:"absolute",top:-36,[isMe?"right":"left"]:-4,background:t.header+"dd",backdropFilter: "blur(12px)", border:`1px solid ${t.border}`,borderRadius:24,padding:"4px 8px",display:"flex",gap:6,zIndex:20,boxShadow:`0 8px 32px rgba(0,0,0,.4)`,animation:"popIn .2s ease", alignItems: "center"}}>
            {t.reactions.map(e=>(
              <span key={e} onClick={()=>onReact(msg.id,e)} style={{cursor:"pointer",fontSize:16,transition:"transform .15s",display:"inline-block"}}
                onMouseEnter={el=>el.currentTarget.style.transform="scale(1.3)"}
                onMouseLeave={el=>el.currentTarget.style.transform="scale(1)"}>{e}</span>
            ))}
            <div style={{width: 1, height: 16, background: t.border, margin: "0 2px"}} />
            <button onClick={() => setShowPicker(!showPicker)} style={{background: "none", border: "none", color: t.acc, cursor: "pointer", fontSize: 18, padding: "0 4px", display: "flex", alignItems: "center", transition: "transform .15s"}}
              onMouseEnter={el=>el.currentTarget.style.transform="scale(1.2)"}
              onMouseLeave={el=>el.currentTarget.style.transform="scale(1)"}>+</button>
          </div>
        )}
        {showPicker && <EmojiPickerOverlay t={t} onSelect={(e) => onReact(msg.id, e)} onClose={() => setShowPicker(false)} isMe={isMe} />}
        <div 
          className={isMe ? "msg-bubble-mine" : "msg-bubble-other"}
          style={{
            background:isMe?t.msgOut:t.msgIn,
            border:`1px solid ${isMe?t.msgOutBrd:t.border}`,
            borderRadius:16, borderBottomRightRadius:isMe?3:16, borderBottomLeftRadius:isMe?16:3,
            padding:"8px 12px", minWidth:80, maxWidth:480, color:t.txt, fontSize:14, lineHeight:1.4, fontFamily:t.font,
            boxShadow: hov?`0 10px 40px ${t.glow}`:isMe?`0 2px 12px ${t.glow2}`:"none",
            transition:"all .25s ease", position:"relative", overflow: "visible",
            display: "flex", flexDirection: "column", gap: 4
          }}
        >
          {/* Status Glow Overlay */}
          {isMe && <div style={{ 
              position: "absolute", inset: 0, borderRadius: "inherit", 
              background: GLOWS[msg.status] || GLOWS.delivered, 
              pointerEvents: "none", zIndex: 0, transition: "background 0.8s ease" 
          }} />}
          
          <div style={{ position: "relative", zIndex: 1, wordBreak: "break-word" }}>{msg.text}</div>

          <div style={{ 
            display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6,
            opacity: 0.65, zIndex: 1, marginTop: -2
          }}>
            <span style={{fontSize:9.5, color:t.txt2, fontFamily:t.font, letterSpacing:".04em", fontWeight: 700}}>{msg.time}</span>
            {isMe && (
              <MessageStatusRing 
                status={msg.status||'delivered'} 
                colorOverride={msg.status==='read' ? t.acc : (msg.status==='failed' ? '#FF5252' : undefined)} 
              />
            )}
          </div>
        </div>
      </div>
      {msg.reactions&&Object.entries(msg.reactions).map(([e,n])=>(
        <span key={e} onClick={()=>onReact(msg.id,e)} style={{display:"inline-flex",alignItems:"center",gap:4,background:t.avatar,border:`1px solid ${t.border}`,borderRadius:14,padding:"3px 10px",fontSize:13,color:t.txt2,cursor:"pointer",marginTop:4,marginRight:4,transition:"border-color .15s"}}
          onMouseEnter={el=>el.currentTarget.style.borderColor=t.acc}
          onMouseLeave={el=>el.currentTarget.style.borderColor=t.border}>
          {e}<span style={{color:t.acc,fontWeight:700,fontSize:12}}>{n}</span>
        </span>
      ))}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
//  VOICE MESSAGE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════
export const VoiceBubble = memo(function VoiceBubble({t,out}) {
  const [playing,setPlaying]=useState(false);
  return (
    <div style={{display:"flex",justifyContent:out?"flex-end":"flex-start",marginBottom:14}}>
      <div style={{background:out?t.msgOut:t.msgIn,border:`1px solid ${out?t.msgOutBrd:t.border}`,borderRadius:16,[`borderBottom${out?"Right":"Left"}Radius`]:3,padding:"8px 12px",display:"flex",alignItems:"center",gap:10,minWidth:200}}>
        <Btn3D style={{width:30,height:30,borderRadius:"50%",background:t.acc,color:t.sendTxt,border:"none"}} onClick={()=>setPlaying(!playing)}>
          {playing?"⏸":"▶"}
        </Btn3D>
        <Wave color={t.wave} active={playing} bars={22} h={30}/>
        <span style={{color:t.txt2,fontSize:12,fontFamily:t.font,whiteSpace:"nowrap"}}>0:42</span>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
//  IMAGE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════
export const ImgBubble = memo(function ImgBubble({t,out}) {
  return (
    <div style={{display:"flex",justifyContent:out?"flex-end":"flex-start",marginBottom:14}}>
      <div style={{background:out?t.msgOut:t.msgIn,border:`1px solid ${out?t.msgOutBrd:t.border}`,borderRadius:16,[`borderBottom${out?"Right":"Left"}Radius`]:3,padding:4,overflow:"hidden",maxWidth:260}}>
        <div style={{width:252,height:160,background:`linear-gradient(135deg,${t.acc}33,${t.acc2}22)`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>{t.decoratorBig}</div>
        <div style={{padding:"5px 10px 3px",fontSize:11,color:t.txt2,fontFamily:t.font}}>image.jpg · 2.4 MB</div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
//  FILE BUBBLE
// ══════════════════════════════════════════════════════════════════════════════
export const FileBubble = memo(function FileBubble({t,out}) {
  return (
    <div style={{display:"flex",justifyContent:out?"flex-end":"flex-start",marginBottom:14}}>
      <div style={{background:out?t.msgOut:t.msgIn,border:`1px solid ${out?t.msgOutBrd:t.border}`,borderRadius:18,[`borderBottom${out?"Right":"Left"}Radius`]:3,padding:"12px 16px",display:"flex",alignItems:"center",gap:14,maxWidth:300}}>
        <div style={{width:44,height:44,borderRadius:12,background:t.acc+"20",border:`1px solid ${t.acc}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📄</div>
        <div style={{flex:1}}>
          <div style={{color:t.txt,fontSize:14,fontWeight:700,fontFamily:t.font}}>document.pdf</div>
          <div style={{color:t.txt2,fontSize:12,marginTop:2}}>4.8 MB · PDF</div>
        </div>
        <Btn3D style={{width:30,height:30,borderRadius:"50%",background:t.acc+"18",border:`1px solid ${t.acc}40`,color:t.acc}} onClick={()=>{}}>
          <Ico d={I.download} size={14} stroke={t.acc}/>
        </Btn3D>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
//  PANEL TOGGLE SECTION
// ══════════════════════════════════════════════════════════════════════════════
function PanelSection({t,title,icon,children,defaultOpen=false}) {
  const [open,setOpen]=useState(defaultOpen);
  return (
    <div style={{marginBottom:2}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"transparent",border:"none",color:t.txt,cursor:"pointer",fontFamily:t.font,fontSize:13,fontWeight:700,letterSpacing:".04em",textAlign:"left"}}>
        <Ico d={icon} size={15} stroke={t.acc}/>
        <span style={{flex:1}}>{title}</span>
        <div style={{transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s",color:t.txt2}}><Ico d={I.up} size={14} stroke={t.txt2}/></div>
      </button>
      {open&&<div style={{padding:"0 12px 10px",animation:"fadeUp .2s ease"}}>{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  EDITABLE FIELD
// ══════════════════════════════════════════════════════════════════════════════
function EditField({t,value,onChange,multiline=false,placeholder="",label=""}) {
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(value);
  const save=()=>{onChange(draft);setEditing(false);};
  return (
    <div style={{marginBottom:8}}>
      {label&&<div style={{color:t.txt2,fontSize:11,marginBottom:4,fontFamily:t.font,letterSpacing:".06em",textTransform:"uppercase"}}>{label}</div>}
      {editing?(
        <div style={{display:"flex",flexDirection:multiline?"column":"row",gap:6}}>
          {multiline
            ?<textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={3} style={{width:"100%",background:t.input,border:`1px solid ${t.acc}`,borderRadius:10,padding:"8px 12px",color:t.txt,fontFamily:t.font,fontSize:13,outline:"none",resize:"none",lineHeight:1.5}}/>
            :<input value={draft} onChange={e=>setDraft(e.target.value)} style={{flex:1,background:t.input,border:`1px solid ${t.acc}`,borderRadius:10,padding:"8px 12px",color:t.txt,fontFamily:t.font,fontSize:13,outline:"none"}}/>
          }
          <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
            <Btn3D style={{padding:"5px 14px",borderRadius:8,background:t.acc,color:t.sendTxt,border:"none",fontSize:12,fontFamily:t.font,fontWeight:700}} onClick={save}>Save</Btn3D>
            <Btn3D style={{padding:"5px 12px",borderRadius:8,background:"transparent",color:t.txt2,border:`1px solid ${t.border}`,fontSize:12,fontFamily:t.font}} onClick={()=>{setDraft(value);setEditing(false);}}>Cancel</Btn3D>
          </div>
        </div>
      ):(
        <div onClick={()=>setEditing(true)} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 12px",background:t.msgIn,border:`1px solid ${t.border}`,borderRadius:10,cursor:"pointer",transition:"border-color .15s",group:true}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=t.acc;e.currentTarget.style.background=t.tag;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.background=t.msgIn;}}>
          <span style={{color:t.txt,fontFamily:t.font,fontSize:13,flex:1,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{value||<span style={{color:t.txt3}}>{placeholder}</span>}</span>
          <Ico d={I.edit} size={13} stroke={t.txt2} style={{flexShrink:0,marginTop:2}}/>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOGGLE ROW
// ══════════════════════════════════════════════════════════════════════════════
function ToggleRow({t,label,sub,value,onChange,icon}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 4px",borderBottom:`1px solid ${t.border}22`}}>
      {icon&&<div style={{width:28,height:28,borderRadius:8,background:t.acc+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico d={icon} size={14} stroke={t.acc}/></div>}
      <div style={{flex:1}}>
        <div style={{color:t.txt,fontSize:13,fontFamily:t.font,fontWeight:600}}>{label}</div>
        {sub&&<div style={{color:t.txt2,fontSize:11,fontFamily:t.font,marginTop:1}}>{sub}</div>}
      </div>
      <button onClick={()=>onChange(!value)} style={{width:42,height:24,borderRadius:12,border:"none",background:value?t.acc:t.border,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
        <div style={{position:"absolute",top:3,left:value?20:3,width:18,height:18,borderRadius:"50%",background:value?t.sendTxt:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SELECT ROW
// ══════════════════════════════════════════════════════════════════════════════
function SelectRow({t,label,options,value,onChange,icon}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 4px",borderBottom:`1px solid ${t.border}22`}}>
      {icon&&<div style={{width:28,height:28,borderRadius:8,background:t.acc+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ico d={icon} size={14} stroke={t.acc}/></div>}
      <div style={{flex:1,color:t.txt,fontSize:13,fontFamily:t.font,fontWeight:600}}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{background:t.input,color:t.txt,border:`1px solid ${t.border}`,borderRadius:8,padding:"5px 10px",fontFamily:t.font,fontSize:12,outline:"none",cursor:"pointer"}}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MEMBER ROW (info panel)
// ══════════════════════════════════════════════════════════════════════════════
function MemberRow({t,m,onRoleChange,onMute,onBan,onKick,canEdit}) {
  const [expand,setExpand]=useState(false);
  const statusCol = {online:t.status,away:"#f59e0b",offline:t.txt3}[m.status]||t.txt3;
  return (
    <div style={{marginBottom:4,borderRadius:12,overflow:"hidden",border:`1px solid ${expand?t.borderAcc:t.border}`,transition:"border-color .15s"}}>
      <div onClick={()=>setExpand(!expand)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:expand?t.tag:t.sidebarItem,cursor:"pointer",transition:"background .15s"}}>
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:t.avatar,border:`1.5px solid ${t.acc}`,display:"flex",alignItems:"center",justifyContent:"center",color:t.avTxt,fontSize:14,fontFamily:t.font}}>{t.decorator}</div>
          <div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:statusCol,border:`2px solid ${t.sidebarItem}`}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:m.muted?t.txt2:t.txt,fontSize:13,fontWeight:700,fontFamily:t.font,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}{m.muted&&" 🔇"}</div>
          <div style={{display:"flex",gap:5,alignItems:"center",marginTop:1}}>
            <span style={{fontSize:10,color:t.acc,fontFamily:t.font,fontWeight:600,background:t.acc+"18",padding:"1px 8px",borderRadius:6}}>{m.role}</span>
            <span style={{fontSize:10,color:statusCol,fontFamily:t.font}}>{m.status}</span>
          </div>
        </div>
        {canEdit&&<Ico d={expand?I.up:"M5 9l7 7 7-7"} size={14} stroke={t.txt2}/>}
      </div>
      {expand&&canEdit&&(
        <div style={{padding:"8px 12px",background:t.msgIn,display:"flex",flexWrap:"wrap",gap:6,borderTop:`1px solid ${t.border}`,animation:"fadeUp .15s ease"}}>
          <select value={m.role} onChange={e=>onRoleChange(m.id,e.target.value)}
            style={{background:t.input,color:t.txt,border:`1px solid ${t.border}`,borderRadius:7,padding:"4px 8px",fontFamily:t.font,fontSize:12,outline:"none"}}>
            {["Owner","Admin","Moderator","Member"].map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <Btn3D style={{padding:"4px 12px",borderRadius:7,background:m.muted?t.acc+"22":t.input,color:m.muted?t.acc:t.txt2,border:`1px solid ${m.muted?t.acc:t.border}`,fontSize:12,fontFamily:t.font}} onClick={()=>onMute(m.id)}>
            {m.muted?"Unmute":"Mute"}
          </Btn3D>
          {m.role!=="Owner"&&<>
            <Btn3D style={{padding:"4px 12px",borderRadius:7,background:"rgba(245,158,11,.08)",color:"#f59e0b",border:"1px solid rgba(245,158,11,.3)",fontSize:12,fontFamily:t.font}} onClick={()=>onBan(m.id)}>
              {m.banned?"Unban":"Ban"}
            </Btn3D>
            <Btn3D style={{padding:"4px 12px",borderRadius:7,background:"rgba(239,68,68,.08)",color:"#ef4444",border:"1px solid rgba(239,68,68,.3)",fontSize:12,fontFamily:t.font}} onClick={()=>onKick(m.id)}>
              Kick
            </Btn3D>
          </>}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  GROUP INFO PANEL (right panel)
// ══════════════════════════════════════════════════════════════════════════════
function InfoPanel({t,group,setGroup,onClose,addToast,onUpdate,onLeave,onDelete,fullArea}) {
  const [tab,setTab]=useState("overview");
  const [inviteCopied,setInviteCopied]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);

  const updateField=(field,val)=>{
    setGroup(g=>({...g,[field]:val}));
    if(onUpdate) onUpdate(field,val);
    else addToast(field.charAt(0).toUpperCase()+field.slice(1)+" updated (local)");
  };
  const handleRoleChange=(id,role)=>{
    setGroup(g=>({...g,members:g.members.map(m=>m.id===id?{...m,role}:m)}));
    addToast("Role updated");
  };
  const handleMute=(id)=>{
    setGroup(g=>({...g,members:g.members.map(m=>m.id===id?{...m,muted:!m.muted}:m)}));
    addToast("Mute toggled");
  };
  const handleBan=(id)=>{
    setGroup(g=>({...g,members:g.members.map(m=>m.id===id?{...m,banned:!m.banned}:m)}));
    addToast("Ban toggled");
  };
  const handleKick=(id)=>{
    setGroup(g=>({...g,members:g.members.filter(m=>m.id!==id)}));
    addToast("Member removed");
  };
  const copyInvite=()=>{
    navigator.clipboard?.writeText(group.inviteLink).catch(()=>{});
    setInviteCopied(true);
    setTimeout(()=>setInviteCopied(false),2000);
    addToast("Invite link copied!");
  };

  const TABS=[
    {id:"overview",label:"Info",    icon:I.grid},
    {id:"members", label:"Members", icon:I.users},
    {id:"media",   label:"Media",   icon:I.img},
    {id:"settings",label:"Settings",icon:I.settings},
    {id:"danger",  label:"Danger",  icon:I.trash},
  ];

  const themeAccentBg=t.acc+"18";
  const dangerRed="#ef4444";

  return (
    <div style={{width:fullArea ? "100%" : 340,borderLeft:fullArea ? "none" : "1px solid "+t.border,background:t.panel,display:"flex",flexDirection:"column",height:"100%",animation:"fadeIn .3s ease",flexShrink:0,position:"relative",overflow:"hidden"}}>
      <ParticleCanvas t={t} style={{opacity:.18}}/>

      {/* HEADER */}
      <div style={{padding:"16px 16px 12px",borderBottom:"1px solid "+t.border,background:t.headerGrad,position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button onClick={onClose}
            style={{background:t.msgIn,border:"1px solid "+t.border,color:t.txt2,cursor:"pointer",padding:"6px 8px",borderRadius:9,display:"flex",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=t.acc}
            onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
            <Ico d={I.back} size={16} stroke={t.txt2}/>
          </button>
          <div style={{flex:1,color:t.txt,fontSize:14,fontWeight:700,fontFamily:t.font,letterSpacing:".04em"}}>Nexus Profile</div>
          <div style={{display:"flex",alignItems:"center",gap:5,background:themeAccentBg,border:"1px solid "+t.acc+"40",borderRadius:20,padding:"4px 10px"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:t.status,boxShadow:"0 0 6px "+t.status}}/>
            <span style={{color:t.acc,fontSize:10,fontFamily:t.font,fontWeight:700,letterSpacing:".06em"}}>
              {group.members.filter(m=>m.status==="online").length} ONLINE
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div style={{textAlign:"center",padding:"4px 0 10px"}}>
          <div style={{position:"relative",display:"inline-block",marginBottom:10}}>
            <div style={{width:76,height:76,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,boxShadow:"0 0 28px "+t.glow,cursor:"pointer",transition:"box-shadow .2s", overflow:"hidden"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 48px "+t.glow}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 0 28px "+t.glow}>
              {(() => {
                const ANIMALS = ['dog', 'cat', 'bunny'];
                // InfoPanel uses 'group.id' or falls back to '1' if missing.
                const entityId = (group.id || group._id || group.name || '0').toString();
                const animal = ANIMALS[parseInt((entityId || "").toString().slice(-4) || '0', 16) % ANIMALS.length] || ANIMALS[0];
                return (
                  <PixelAvatarBadge
                    type={animal}
                    state="idle"
                    size={70}
                    showDot={false}
                    style={{
                      imageRendering: "pixelated",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                    }}
                  />
                );
              })()}
            </div>
            <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:"1px solid "+t.acc+"30",pointerEvents:"none"}}/>
          </div>
          <div style={{color:t.txt,fontSize:17,fontWeight:800,fontFamily:t.font,letterSpacing:".05em",marginBottom:3}}>{group.name}</div>
          <div style={{color:t.txt2,fontSize:11,fontFamily:t.font,marginBottom:9}}>
            {group.members.length} members · {(group.messageCount||0).toLocaleString()} messages
          </div>
          <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
            {(group.tags||[]).map(tag=>(
              <span key={tag} style={{background:t.tag,border:"1px solid "+t.tagBrd,borderRadius:20,padding:"2px 10px",fontSize:10,color:t.acc,fontFamily:t.font,fontWeight:700,letterSpacing:".04em"}}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",gap:2,background:t.msgIn,borderRadius:12,padding:3,border:"1px solid "+t.border}}>
          {TABS.map(tb=>{
            const isActive=tab===tb.id;
            const isDanger=tb.id==="danger";
            return (
              <button key={tb.id} onClick={()=>setTab(tb.id)}
                style={{flex:1,padding:"6px 4px",borderRadius:9,border:"none",
                  background:isActive?(isDanger?dangerRed:t.acc):"transparent",
                  color:isActive?(isDanger?"#fff":t.sendTxt):isDanger?dangerRed:t.txt2,
                  cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  transition:"all .15s",fontSize:8,fontFamily:t.font,fontWeight:700,
                  letterSpacing:".04em",textTransform:"uppercase",opacity:isActive?1:0.65}}>
                <Ico d={tb.icon} size={12} stroke="currentColor"/>
                {tb.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 0",position:"relative",zIndex:1,scrollbarWidth:"thin",scrollbarColor:t.scrollbar+" transparent"}}>

        {/* ── OVERVIEW ── */}
        {tab==="overview"&&(
          <div style={{padding:"0 14px",animation:"fadeUp .2s ease"}}>
            {/* Quick actions */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {label:"Mute",   icon:I.bell,   action:()=>addToast("Notifications muted")},
                {label:"Search", icon:I.search, action:()=>addToast("Search in chat")},
                {label:"Media",  icon:I.img,    action:()=>setTab("media")},
                {label:"Invite", icon:I.link,   action:copyInvite},
              ].map(({label,icon,action})=>(
                <Btn3D key={label} onClick={action} title={label}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 8px",background:t.msgIn,border:"1px solid "+t.border,borderRadius:12,cursor:"pointer",transition:"border-color .15s,box-shadow .15s"}}>
                  <div style={{width:32,height:32,borderRadius:10,background:themeAccentBg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Ico d={icon} size={15} stroke={t.acc}/>
                  </div>
                  <span style={{color:t.txt2,fontSize:10,fontFamily:t.font,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase"}}>{label}</span>
                </Btn3D>
              ))}
            </div>
            <PanelSection t={t} title="Group Name" icon={I.hash} defaultOpen>
              <EditField t={t} value={group.name||""} onChange={v=>updateField("name",v)} placeholder="Enter group name…"/>
            </PanelSection>
            <PanelSection t={t} title="Description" icon={I.tag} defaultOpen>
              <EditField t={t} value={group.description||""} onChange={v=>updateField("description",v)} multiline placeholder="Describe your nexus…"/>
            </PanelSection>
            <PanelSection t={t} title="Pinned Message" icon={I.pin}>
              <EditField t={t} value={group.pinnedMsg||""} onChange={v=>updateField("pinnedMsg",v)} multiline placeholder="Pin something important…"/>
            </PanelSection>
            <PanelSection t={t} title="Invite Link" icon={I.link}>
              <div style={{display:"flex",gap:6,alignItems:"center",padding:"8px 12px",background:t.msgIn,border:"1px solid "+t.border,borderRadius:10}}>
                <span style={{flex:1,color:t.acc,fontSize:11,fontFamily:t.font,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{group.inviteLink}</span>
                <Btn3D style={{padding:"4px 10px",borderRadius:7,background:inviteCopied?t.acc:"transparent",color:inviteCopied?t.sendTxt:t.txt2,border:"1px solid "+t.border,fontSize:11,fontFamily:t.font,whiteSpace:"nowrap"}} onClick={copyInvite}>
                  {inviteCopied?"✓ Copied":"Copy"}
                </Btn3D>
              </div>
            </PanelSection>
            <PanelSection t={t} title="Stats" icon={I.clock}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  ["Messages",(group.messageCount||0).toLocaleString()],
                  ["Members",group.members?.length||0],
                  ["Created",group.createdAt||"—"],
                  ["Files",(group.media?.length||0)+" shared"],
                ].map(([k,v])=>(
                  <div key={k} style={{background:t.msgIn,border:"1px solid "+t.border,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{color:t.acc,fontSize:17,fontWeight:800,fontFamily:t.font}}>{v}</div>
                    <div style={{color:t.txt2,fontSize:10,fontFamily:t.font,marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>{k}</div>
                  </div>
                ))}
              </div>
            </PanelSection>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab==="members"&&(
          <div style={{padding:"0 14px",animation:"fadeUp .2s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 2px 12px"}}>
              <div>
                <div style={{color:t.txt,fontSize:13,fontWeight:700,fontFamily:t.font}}>{group.members.length} Members</div>
                <div style={{color:t.txt2,fontSize:11,fontFamily:t.font}}>{group.members.filter(m=>m.status==="online").length} online</div>
              </div>
              <Btn3D style={{padding:"7px 14px",borderRadius:10,background:t.acc,color:t.sendTxt,border:"none",fontSize:12,fontFamily:t.font,fontWeight:700,boxShadow:"0 4px 16px "+t.glow}}
                onClick={()=>addToast("Invite member (demo)")}>+ Invite</Btn3D>
            </div>
            {["Owner","Admin","Moderator","Member"].map(role=>{
              const rm=group.members.filter(m=>m.role===role);
              if(!rm.length)return null;
              const roleEmoji={"Owner":"👑","Admin":"🛡️","Moderator":"⚡","Member":"●"}[role]||"●";
              return (
                <div key={role} style={{marginBottom:14}}>
                  <div style={{color:t.txt2,fontSize:10,fontFamily:t.font,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",padding:"4px 0 8px"}}>
                    {roleEmoji} {role}s ({rm.length})
                  </div>
                  {rm.map(m=>(
                    <MemberRow key={m.id} t={t} m={m}
                      onRoleChange={handleRoleChange} onMute={handleMute}
                      onBan={handleBan} onKick={handleKick}
                      canEdit={role!=="Owner"}/>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MEDIA ── */}
        {tab==="media"&&(
          <div style={{padding:"0 14px",animation:"fadeUp .2s ease"}}>
            <div style={{color:t.txt2,fontSize:10,fontFamily:t.font,letterSpacing:".08em",textTransform:"uppercase",padding:"0 2px 10px",fontWeight:700}}>
              Images ({(group.media||[]).filter(m=>m.type==="image").length})
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:16}}>
              {(group.media||[]).filter(m=>m.type==="image").length>0
                ?(group.media||[]).filter(m=>m.type==="image").map((m,i)=>(
                    <div key={i} style={{aspectRatio:"1",background:"linear-gradient(135deg,"+t.acc+"22,"+t.acc2+"18)",borderRadius:10,border:"1px solid "+t.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,cursor:"pointer",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.acc;e.currentTarget.style.transform="scale(1.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.transform="scale(1)";}}>
                      {t.decoratorBig}
                    </div>
                  ))
                :<div style={{gridColumn:"1/-1",padding:"24px 0",textAlign:"center",color:t.txt2,fontSize:13,fontFamily:t.font}}>No images yet</div>
              }
            </div>
            <div style={{color:t.txt2,fontSize:10,fontFamily:t.font,letterSpacing:".08em",textTransform:"uppercase",padding:"0 2px 10px",fontWeight:700}}>
              Files ({(group.media||[]).filter(m=>m.type==="file").length})
            </div>
            {(group.media||[]).filter(m=>m.type==="file").map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:t.msgIn,border:"1px solid "+t.border,borderRadius:10,marginBottom:6,cursor:"pointer",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=t.acc}
                onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                <div style={{width:36,height:36,borderRadius:9,background:themeAccentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📄</div>
                <div style={{flex:1}}>
                  <div style={{color:t.txt,fontSize:13,fontFamily:t.font,fontWeight:600}}>{m.name}</div>
                  <div style={{color:t.txt2,fontSize:11}}>{m.size}</div>
                </div>
                <Ico d={I.download} size={16} stroke={t.txt2}/>
              </div>
            ))}
            {!(group.media||[]).filter(m=>m.type==="file").length&&(
              <div style={{padding:"12px 0",textAlign:"center",color:t.txt2,fontSize:13,fontFamily:t.font}}>No files yet</div>
            )}
            {(group.links||[]).length>0&&(
              <>
                <div style={{color:t.txt2,fontSize:10,fontFamily:t.font,letterSpacing:".08em",textTransform:"uppercase",padding:"12px 2px 10px",fontWeight:700}}>Shared Links</div>
                {group.links.map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:t.msgIn,border:"1px solid "+t.border,borderRadius:10,marginBottom:6,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=t.acc}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                    <Ico d={I.link} size={13} stroke={t.acc}/>
                    <span style={{color:t.acc,fontSize:11,fontFamily:t.font,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l}</span>
                    <Ico d={I.copy} size={13} stroke={t.txt2}/>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==="settings"&&(
          <div style={{padding:"0 14px",animation:"fadeUp .2s ease"}}>
            <PanelSection t={t} title="Privacy" icon={I.lock} defaultOpen>
              <SelectRow t={t} label="Visibility" icon={I.globe}
                options={[{v:"public",l:"🌐 Public"},{v:"private",l:"🔒 Private"},{v:"secret",l:"🕵️ Secret"}]}
                value={group.privacy||"private"} onChange={v=>updateField("privacy",v)}/>
              <SelectRow t={t} label="Notifications" icon={I.bell}
                options={[{v:"all",l:"🔔 All"},{v:"mentions",l:"💬 Mentions"},{v:"none",l:"🔕 None"}]}
                value={group.notifications||"all"} onChange={v=>updateField("notifications",v)}/>
            </PanelSection>
            <PanelSection t={t} title="Restrictions" icon={I.shield} defaultOpen>
              <ToggleRow t={t} label="Slow Mode" sub={group.slowMode>0?group.slowMode+"s delay":"Off"} icon={I.clock}
                value={group.slowMode>0} onChange={on=>updateField("slowMode",on?10:0)}/>
              {group.slowMode>0&&(
                <SelectRow t={t} label="Slow Mode Delay" icon={I.clock}
                  options={[{v:5,l:"5s"},{v:10,l:"10s"},{v:30,l:"30s"},{v:60,l:"1 min"}]}
                  value={group.slowMode} onChange={v=>updateField("slowMode",Number(v))}/>
              )}
              <SelectRow t={t} label="Max Members" icon={I.users}
                options={[{v:25,l:"25"},{v:50,l:"50"},{v:100,l:"100"},{v:250,l:"250"},{v:1000,l:"1000"}]}
                value={group.maxMembers||50} onChange={v=>updateField("maxMembers",Number(v))}/>
              <SelectRow t={t} label="Auto-Delete" icon={I.clock}
                options={[{v:0,l:"Off"},{v:3600,l:"1 Hour"},{v:86400,l:"24 Hours"},{v:604800,l:"7 Days"}]}
                value={group.disappearingMessages||0} onChange={v=>updateField("disappearingMessages",Number(v))}/>
            </PanelSection>
            <PanelSection t={t} title="Member Permissions" icon={I.crown}>
              {[["Send Messages","text allowed"],["Send Media","images/files"],["Add Members","invite others"],["Change Info","edit group"],["Pin Messages","pin allowed"]].map(([l,s],i)=>(
                <ToggleRow key={i} t={t} label={l} sub={s} value={i<3} onChange={()=>addToast(l+" toggled")}/>
              ))}
            </PanelSection>
            <PanelSection t={t} title="Display" icon={I.grid}>
              {[["Join/Leave Events","system messages"],["Read Receipts","double ticks"],["Compact View","denser layout"]].map(([l,s],i)=>(
                <ToggleRow key={i} t={t} label={l} sub={s} value={i===0} onChange={()=>addToast(l+" toggled")}/>
              ))}
            </PanelSection>
          </div>
        )}

        {/* ── DANGER ── */}
        {tab==="danger"&&(
          <div style={{padding:"0 14px",animation:"fadeUp .2s ease"}}>
            <div style={{background:dangerRed+"08",border:"1px solid "+dangerRed+"30",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:28,height:28,borderRadius:8,background:dangerRed+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>⚠️</div>
                <div style={{color:dangerRed,fontSize:13,fontWeight:700,fontFamily:t.font}}>Danger Zone</div>
              </div>
              <div style={{color:t.txt2,fontSize:12,fontFamily:t.font,lineHeight:1.6}}>These actions are irreversible. Proceed with extreme caution.</div>
            </div>
            {[
              {label:"Clear Chat History",   sub:"Delete all messages permanently",        icon:I.trash,    color:"#f59e0b",ok:false},
              {label:"Reset Invite Link",    sub:"Invalidate current link, issue new one", icon:I.link,     color:"#a855f7",ok:false},
              {label:"Transfer Ownership",   sub:"Give admin control to another member",   icon:I.crown,    color:"#3b82f6",ok:false},
              {label:"Export Chat",          sub:"Download full conversation history",     icon:I.download, color:"#22d3ee",ok:false},
              {label:"Archive Nexus",        sub:"Hide from active list, preserve data",   icon:I.settings, color:"#f59e0b",ok:false},
              {label:"Leave Nexus",          sub:"Exit this nexus and remove it from your list", icon:I.back,     color:"#f59e0b", leave:true},
              {label:"Delete Nexus Forever", sub:"Permanently destroy this nexus",         icon:I.trash,    color:dangerRed, delete:true},
            ].map(({label,sub,icon,color,leave,delete:isDel,ok})=>(
              <div key={label} style={{marginBottom:8}}>
                <Btn3D onClick={()=>{
                  if(leave){ if(onLeave) onLeave(); else addToast("Leave not implemented"); }
                  else if(isDel){
                    if(!confirmDelete){setConfirmDelete(true);setTimeout(()=>setConfirmDelete(false),4000);addToast("⚠️ Tap again to confirm");}
                    else{ if(onDelete) onDelete(); else addToast("Delete not implemented"); setConfirmDelete(false);}
                  }
                  else{addToast(label+" executed (demo)");}
                }}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isDel&&confirmDelete?color+"20":color+"08",border:"1px solid "+(isDel&&confirmDelete?color:color+"35"),borderRadius:12,textAlign:"left",cursor:"pointer",transition:"all .15s"}}>
                  <div style={{width:34,height:34,borderRadius:10,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Ico d={icon} size={15} stroke={color}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:ok&&confirmDelete?"#fff":color,fontSize:13,fontWeight:700,fontFamily:t.font}}>{ok&&confirmDelete?"⚠️ Confirm: "+label:label}</div>
                    <div style={{color:t.txt2,fontSize:11,fontFamily:t.font,marginTop:1}}>{sub}</div>
                  </div>
                  <Ico d={I.back} size={13} stroke={color} style={{transform:"rotate(180deg)",opacity:.4}}/>
                </Btn3D>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  EMOJI / GIF / STICKER PLACEHOLDER PANEL
// ══════════════════════════════════════════════════════════════════════════════
function MediaPanel({t,mode,onClose,onSelectEmoji}) {
  return (
    <div style={{position:"absolute",bottom:"100%",left:0,right:0,background:t.emojiPnl,border:`1px solid ${t.border}`,borderRadius:"16px 16px 0 0",zIndex:40,maxHeight:300,overflow:"hidden",boxShadow:`0 -8px 32px rgba(0,0,0,.4)`,animation:"fadeUp .2s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 8px",borderBottom:`1px solid ${t.border}`}}>
        <span style={{color:t.txt,fontSize:13,fontWeight:700,fontFamily:t.font,letterSpacing:".04em"}}>
          {mode==="emoji"?"😄 Emoji Picker":mode==="gif"?"🎬 GIF Search":"🎭 Sticker Pack"}
        </span>
        <button onClick={onClose} style={{background:"none",border:"none",color:t.txt2,cursor:"pointer",display:"flex"}}><Ico d={I.x} size={16} stroke={t.txt2}/></button>
      </div>
      {/* ─── PLACEHOLDER: drop in react-emoji-picker, giphy-react, etc ─── */}
      <div style={{height:230,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:t.txt2}}>
        <div style={{fontSize:40}}>{mode==="emoji"?"😄":mode==="gif"?"🎬":"🎭"}</div>
        <div style={{fontSize:14,fontFamily:t.font,fontWeight:600,color:t.txt}}>{mode==="emoji"?"Emoji Picker":"gif"===mode?"GIF Search":"Sticker Pack"}</div>
        <div style={{fontSize:11,fontFamily:t.font,color:t.txt3,textAlign:"center",maxWidth:220,lineHeight:1.6}}>
          Plug in your <code style={{color:t.acc,background:t.acc+"18",padding:"1px 6px",borderRadius:4,fontSize:10}}>react-emoji</code> / <code style={{color:t.acc,background:t.acc+"18",padding:"1px 6px",borderRadius:4,fontSize:10}}>@giphy/react</code> component here
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
          {["😀","😂","🥰","🔥","💎","⚡","🎮","🌸","👑","🩸"].map(e=>(
            <span key={e} onClick={()=>{onSelectEmoji(e);}} style={{fontSize:22,cursor:"pointer",padding:6,borderRadius:8,transition:"background .15s"}}
              onMouseEnter={el=>el.currentTarget.style.background=t.glow2}
              onMouseLeave={el=>el.currentTarget.style.background="transparent"}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHAT AREA
// ══════════════════════════════════════════════════════════════════════════════
function ChatArea({t,group,setGroup,themeId}) {
  const [msgs,setMsgs]=useState(()=>SAMPLE_MSGS(themeId));
  const [input,setInput]=useState("");
  const [recording,setRecording]=useState(false);
  const [recSec,setRecSec]=useState(0);
  const [mediaPanel,setMediaPanel]=useState(null);
  const [callType,setCallType]=useState(null);
  const [showInfo,setShowInfo]=useState(false);
  const [typing,setTyping]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [searchQ,setSearchQ]=useState("");
  const [toast,setToast]=useState(null);
  const [pinnedVisible,setPinnedVisible]=useState(true);
  const endRef=useRef(null);
  const inputRef=useRef(null);
  const recRef=useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,typing]);
  useEffect(()=>{
    if(recording){ recRef.current=setInterval(()=>setRecSec(s=>s+1),1000); }
    else{ clearInterval(recRef.current); setRecSec(0); }
    return()=>clearInterval(recRef.current);
  },[recording]);

  const addToast=useCallback((msg)=>{ setToast(null); setTimeout(()=>setToast(msg),10); },[]);

  const REPLIES={
    vampire:["The shadows acknowledge your words.","Blood will tell.","The coven is pleased.","As the dark moon decrees."],
    premium:["Noted. I shall arrange accordingly.","Certainly. Considered done.","Of course, right away.","Understood. Proceeding with discretion."],
    amoled:["Transaction verified.","Asset secured in the vault.","Portfolio updated accordingly.","Gold key authenticated."],
    cyberpunk:["DATA CONFIRMED.","HACK ACKNOWLEDGED.","NETRUN COMPLETE. Trace wiped.","SIGNAL RECEIVED. ICE down."],
    gamer:["GG EZ.","NOOB DETECTED. JK lol.","RESPAWNING...","CLUTCH RESPONSE."],
    barbie:["Omg yasss!! 💅","Totally bestie 🌸","You're literally the best ✨","ICONIC. We love you! 💖"],
  };

  const sendMsg=useCallback((text)=>{
    if(!text.trim())return;
    const now=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",hour12:false});
    setMsgs(p=>[...p,{id:Date.now(),from:"You",uid:0,text,out:true,time:now}]);
    setInput(""); setMediaPanel(null);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      const r=REPLIES[themeId][Math.floor(Math.random()*4)];
      setMsgs(p=>[...p,{id:Date.now()+1,from:group.members[0]?.name||"Nexus",uid:1,text:r,out:false,time:new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",hour12:false})}]);
    },1000+Math.random()*800);
  },[themeId,group]);

  const sendVoice=()=>{
    const now=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",hour12:false});
    setMsgs(p=>[...p,{id:Date.now(),from:"You",uid:0,text:"__voice__",out:true,time:now}]);
    setRecording(false);
  };
  const sendImg=()=>{
    const now=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",hour12:false});
    setMsgs(p=>[...p,{id:Date.now(),from:"You",uid:0,text:"__img__",out:true,time:now}]);
  };
  const sendFile=()=>{
    const now=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",hour12:false});
    setMsgs(p=>[...p,{id:Date.now(),from:"You",uid:0,text:"__file__",out:true,time:now}]);
  };

  const handleReact=(id,e)=>{
    setMsgs(p=>p.map(m=>{
      if(m.id!==id)return m;
      const r={...(m.reactions||{})};
      r[e]=(r[e]||0)+1;
      return{...m,reactions:r};
    }));
  };

  const filtered=searchQ?msgs.filter(m=>typeof m.text==="string"&&!["__voice__","__img__","__file__"].includes(m.text)&&m.text.toLowerCase().includes(searchQ.toLowerCase())):msgs;

  const gridBg=`repeating-linear-gradient(${t.grid} 0,${t.grid} 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,${t.grid} 0,${t.grid} 1px,transparent 1px,transparent 32px)`;

  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",height:"100%",position:"relative",overflow:"hidden"}}>

      {/* ── TOP HEADER BAR ── */}
      <div style={{background:t.headerGrad,borderBottom:`1px solid ${t.border}`,padding:"0 20px",display:"flex",alignItems:"center",gap:12,height:64,flexShrink:0,position:"relative",zIndex:10}}>
        <div style={{position:"relative",cursor:"pointer"}} onClick={()=>setShowInfo(!showInfo)}>
          <div style={{width:44,height:44,borderRadius:"50%",background:t.avatar,border:`2.5px solid ${t.acc}`,display:"flex",alignItems:"center",justifyContent:"center",color:t.avTxt,fontSize:18,fontFamily:t.font,boxShadow:`0 0 20px ${t.glow}`,transition:"box-shadow .2s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 36px ${t.glow}`}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 20px ${t.glow}`}>
            {t.decoratorBig}
          </div>
          <div style={{position:"absolute",bottom:1,right:1,width:12,height:12,borderRadius:"50%",background:t.status,border:`2.5px solid ${t.bg}`,boxShadow:`0 0 10px ${t.status}`}}/>
        </div>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>setShowInfo(!showInfo)}>
          <div style={{color:t.txt,fontWeight:800,fontSize:16,fontFamily:t.font,letterSpacing:".04em"}}>{group.name}</div>
          <div style={{color:t.txt2,fontSize:12,fontFamily:t.font,letterSpacing:".02em"}}>{group.members.filter(m=>m.status==="online").length} online · {group.members.length} members</div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <TBtn t={t} d={I.search} label="Search messages" active={searchOpen} onClick={()=>{setSearchOpen(!searchOpen);setSearchQ("");}}/>
          <TBtn t={t} d={I.phone} label="Voice call" onClick={()=>setCallType("voice")} sz={19}/>
          <TBtn t={t} d={I.video} label="Video call" onClick={()=>setCallType("video")} sz={19}/>
          <TBtn t={t} d={I.settings} label="Group info" active={showInfo} onClick={()=>setShowInfo(!showInfo)} sz={19}/>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      {searchOpen&&(
        <div style={{background:t.header,borderBottom:`1px solid ${t.border}`,padding:"8px 20px",display:"flex",gap:10,alignItems:"center",animation:"fadeUp .15s ease",flexShrink:0}}>
          <Ico d={I.search} size={16} stroke={t.txt2}/>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus placeholder="Search messages…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:t.txt,fontSize:14,fontFamily:t.font}}/>
          {searchQ&&<button onClick={()=>setSearchQ("")} style={{background:"none",border:"none",color:t.txt2,cursor:"pointer",display:"flex"}}><Ico d={I.x} size={14} stroke={t.txt2}/></button>}
          <span style={{color:t.txt2,fontSize:12,fontFamily:t.font,whiteSpace:"nowrap"}}>{searchQ?`${filtered.length} found`:""}</span>
        </div>
      )}

      {/* ── PINNED BANNER ── */}
      {pinnedVisible&&(
        <div style={{background:t.tag,borderBottom:`1px solid ${t.border}`,padding:"8px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <Ico d={I.pin} size={14} stroke={t.acc}/>
          <div style={{flex:1,overflow:"hidden"}}>
            <div style={{color:t.txt2,fontSize:10,fontFamily:t.font,textTransform:"uppercase",letterSpacing:".08em",marginBottom:1}}>Pinned</div>
            <div style={{color:t.txt,fontSize:13,fontFamily:t.font,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{group.pinnedMsg}</div>
          </div>
          <button onClick={()=>setPinnedVisible(false)} style={{background:"none",border:"none",color:t.txt2,cursor:"pointer",display:"flex"}}><Ico d={I.x} size={14} stroke={t.txt2}/></button>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px",backgroundImage:gridBg,backgroundSize:"32px 32px",scrollbarWidth:"thin",scrollbarColor:`${t.scrollbar} transparent`,position:"relative"}}>
        {/* Date divider */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{flex:1,height:1,background:t.border}}/>
          <span style={{color:t.txt2,fontSize:11,fontFamily:t.font,letterSpacing:".08em",whiteSpace:"nowrap"}}>Today</span>
          <div style={{flex:1,height:1,background:t.border}}/>
        </div>
        {filtered.map(m=>{
          if(m.text==="__voice__") return <VoiceBubble key={m.id} t={t} out={m.out}/>;
          if(m.text==="__img__") return <ImgBubble key={m.id} t={t} out={m.out}/>;
          if(m.text==="__file__") return <FileBubble key={m.id} t={t} out={m.out}/>;
          return <MsgBubble key={m.id} msg={m} t={t} onReact={handleReact} isMe={m.out}/>;
        })}
        {typing&&<Typing t={t}/>}
        <div ref={endRef}/>
      </div>

      {/* ── COMPOSER ── */}
      <div className="nxi-shell" style={{ background: t.header, borderTop: `1px solid ${t.border}`, flexShrink: 0, position: "relative" }}>
        <style>{`
          .orb-input::placeholder { color: ${t.txt2}; opacity: 0.5; font-style: italic; }
          .orb-input-wrapper { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .orb-input-wrapper:focus-within { border-color: ${t.acc} !important; box-shadow: 0 8px 32px ${t.glow} !important; transform: translateY(-1px); }
        `}</style>

        {mediaPanel && <MediaPanel t={t} mode={mediaPanel} onClose={() => setMediaPanel(null)} onSelectEmoji={e => { setInput(v => v + e); inputRef.current?.focus(); setMediaPanel(null); }} />}

        {/* Recording bar */}
        {recording && (
          <div style={{ padding: "10px 20px", background: t.msgIn, borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3131", animation: "recPulse 1s ease-in-out infinite", flexShrink: 0 }} />
            <Wave color={t.wave} active bars={36} h={32} />
            <span style={{ color: t.txt, fontSize: 14, fontFamily: t.font, minWidth: 40, fontVariantNumeric: "tabular-nums" }}>{fmt(recSec)}</span>
            <span style={{ color: t.txt2, fontSize: 12, fontFamily: t.font, marginLeft: "auto" }}>Tap mic to send</span>
          </div>
        )}

        {/* Toolbar row */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 20px 4px", gap: 2 }}>
          <TBtn t={t} d={I.emoji} label="Emoji" active={mediaPanel === "emoji"} onClick={() => setMediaPanel(mediaPanel === "emoji" ? null : "emoji")} />
          <TBtn t={t} d={I.sticker} label="Stickers" active={mediaPanel === "sticker"} onClick={() => setMediaPanel(mediaPanel === "sticker" ? null : "sticker")} />
          <TBtn t={t} d={I.gif} label="GIF" active={mediaPanel === "gif"} onClick={() => setMediaPanel(mediaPanel === "gif" ? null : "gif")} />
          <TBtn t={t} d={I.img} label="Image" onClick={() => { sendImg(); addToast("Image shared"); }} />
          <TBtn t={t} d={I.attach} label="File" onClick={() => { sendFile(); addToast("File shared"); }} />
          <div style={{ flex: 1 }} />
          {group.slowMode > 0 && <span style={{ color: t.txt2, fontSize: 11, fontFamily: t.font, marginRight: 8 }}>⏱ {group.slowMode}s mode</span>}
          <span style={{ color: t.txt2, fontSize: 11, fontFamily: t.font }}>{group.members.filter(m => m.status === "online").length} online</span>
        </div>

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "flex-end", padding: "8px 20px 24px", gap: 12 }}>
          {/* Text field wrapper */}
          <div
            className="orb-input-wrapper"
            style={{ 
              flex: 1, display: "flex", alignItems: "center", 
              background: t.input, border: `2px solid ${t.inputBrd}`, 
              borderRadius: 30, padding: "4px 12px 4px 24px", gap: 12, 
              boxShadow: `0 4px 15px ${t.glow2}`,
              minHeight: 56
            }}
          >
            <input
              ref={inputRef}
              className="orb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(input); } }}
              disabled={recording}
              placeholder={recording ? "🎙️ Recording…" : `Message ${group.name}…`}
              style={{ 
                flex: 1, background: "transparent", border: "none", outline: "none", 
                color: t.txt, fontSize: 16, fontFamily: t.font, 
                padding: "14px 0", lineHeight: 1.5, letterSpacing: ".01em" 
              }}
              spellCheck="false"
            />
            {input.length > 0 && (
              <span style={{ 
                color: t.acc, fontSize: 11, fontFamily: t.font, fontWeight: 800,
                background: `${t.acc}18`, padding: "5px 12px", borderRadius: 20,
                flexShrink: 0, transition: "opacity .2s", letterSpacing: ".05em"
              }}>
                {input.length}
              </span>
            )}
          </div>

          {/* Action Buttons Container */}
          <div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
            {/* Mic button */}
            <Btn3D
              onClick={recording ? sendVoice : () => setRecording(true)}
              style={{ 
                width: 52, height: 52, borderRadius: 26, 
                border: recording ? "none" : `2px solid ${t.border}`, 
                background: recording ? "#ff3b30" : t.msgIn, 
                color: recording ? "#fff" : t.toolC, 
                flexShrink: 0, 
                boxShadow: recording ? "0 8px 32px rgba(255,59,48,0.4)" : `0 4px 15px ${t.glow2}` 
              }}
              title={recording ? "Send voice message" : "Record voice message"}
            >
              <Ico d={recording ? I.mic2 : I.mic} size={22} stroke="currentColor" />
            </Btn3D>

            {/* Send button — appears when text is non-empty */}
            {input.trim() && (
              <Btn3D
                onClick={() => sendMsg(input)}
                style={{ 
                  width: 52, height: 52, borderRadius: 26, border: "none", 
                  background: t.send, color: t.sendTxt, flexShrink: 0, 
                  boxShadow: `0 8px 32px ${t.glow}`, animation: "popIn .3s cubic-bezier(0.34, 1.56, 0.64, 1)" 
                }}
                title="Send message"
              >
                <Ico d={I.send} size={22} stroke={t.sendTxt} style={{ transform: "translate(1px, -1px)" }} />
              </Btn3D>
            )}
          </div>
        </div>
      </div>

      {/* ── INFO PANEL ── */}
      {showInfo&&(
        <div style={{position:"absolute",top:0,right:0,bottom:0,left:0,zIndex:30,display:"flex"}}>
          <InfoPanel t={t} group={group} setGroup={setGroup} onClose={()=>setShowInfo(false)} addToast={addToast} fullArea={true}/>
        </div>
      )}

      {/* ── CALL OVERLAY ── */}
      {callType&&<CallOverlay t={t} type={callType} onEnd={()=>setCallType(null)}/>}

      {/* ── TOAST ── */}
      {toast&&<Toast key={toast+Date.now()} t={t} msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT APP — THEME SWITCHER + LAYOUT
// ══════════════════════════════════════════════════════════════════════════════
const THEME_KEYS=["vampire","premium","amoled","cyberpunk","gamer","barbie"];



export { ChatArea, THEMES, makeGroupState, Ico, I, Toast, CallOverlay, Btn3D, TBtn, Typing, InfoPanel, ParticleCanvas, Wave, MediaPanel };
