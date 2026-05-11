import React, { useState, memo, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useThemeStore } from "../store/useThemeStore";
import { spotifyService } from "../services/spotifyService";
import VampireThemeLayout from "../components/layout/themes/vampire/VampireThemeLayout";
import "./styles/vampire.css";
import { API_URL } from "../config";
import batLogo from "../assets/bat.svg";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import NexusActionOverlay from "../components/nexus/NexusActionOverlay";
import { PixelAvatarBadge } from "../components/avatar/PixelAvatar/PixelAvatarBadge.jsx";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";
import { THEMES, THEME_LABELS } from "../constants";
import { gsap } from "gsap";

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const ToggleSwitch = ({ label, checked, onChange }) => (
  <div className="v-toggle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(139,0,0,0.03)", borderRadius: "8px", border: "1px solid rgba(139,0,0,0.08)", marginBottom: "10px" }}>
    <span className="v-label" style={{ margin: 0 }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 20, borderRadius: 10, background: checked ? "var(--crimson)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#000" : "#666", position: "absolute", top: 2, left: checked ? 22 : 2, transition: "all 0.3s" }} />
    </div>
  </div>
);

// ── Vampire-Orbit UI ──────────────────────────────────────────────
// Fonts loaded via @import inside the style tag below

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');

  /* ── Subtle Scrollbar (Global for Theme) ── */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(139, 0, 0, 0.4) var(--void);
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--void); }
  ::-webkit-scrollbar-thumb { 
    background: rgba(139, 0, 0, 0.3); 
    border-radius: 0;
    border-left: 1px solid rgba(220,20,60,0.08);
  }
  ::-webkit-scrollbar-thumb:hover { background: rgba(220, 20, 60, 0.55); }

  .vamp-scroll-hide::-webkit-scrollbar { display: none; }
  .vamp-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }

  :root {
    --blood:      #8B0000;
    --crimson:    #DC143C;
    --rose:       #C0392B;
    --void:       #050508;
    --obsidian:   #0A0A10;
    --shadow:     #0F0F18;
    --crypt:      #141420;
    --dusk:       #1A1A2E;
    --ash:        #2A2A3E;
    --bone:       #D4C5A9;
    --ivory:      #F0E6D3;
    --silver:     #A89BB0;
    --mist:       #7B6E8A;
    --glimmer:    rgba(220,20,60,0.15);
    --vein:       rgba(139,0,0,0.4);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: var(--void); font-family: 'Cinzel', serif; }

  .orbit-root {
    min-height: 100vh;
    background: var(--void);
    color: var(--ivory);
    overflow: hidden;
    position: relative;
  }

  .lm-mobile-canvas {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flexDirection: column; background: var(--void);
    overflow: hidden;
  }
  .lm-mobile-only { display: none !important; }
  .lm-desktop-only { display: flex; }

  @media (max-width: 768px) {
    .lm-mobile-only { display: flex !important; }
    .lm-desktop-only { display: none !important; }
  }

  /* ── Atmospheric background ── */
  .bg-atmosphere {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139,0,0,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(80,0,80,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 100% 100% at 50% 50%, var(--void) 40%, #080010 100%);
  }

  .blood-drip {
    position: fixed; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, transparent, var(--crimson), var(--blood), var(--crimson), transparent);
    box-shadow: 0 0 20px var(--crimson), 0 0 60px var(--blood);
    z-index: 100;
  }

  /* Floating blood particles */
  .particle {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
    background: var(--crimson);
    box-shadow: 0 0 6px var(--crimson);
    opacity: 0;
  }

  /* Blood Rain */
  .blood-drop-particle {
    position: absolute;
    top: -50px;
    width: 1px;
    height: 40px;
    background: linear-gradient(to bottom, transparent, var(--crimson), var(--blood));
    filter: blur(0.4px);
    pointer-events: none;
    z-index: 1;
    opacity: 0.6;
  }

  /* Rising Embers */
  .ember-particle {
    position: absolute;
    bottom: -20px;
    width: 2px;
    height: 2px;
    background: #ff4500;
    border-radius: 50%;
    box-shadow: 0 0 10px #ff4500, 0 0 20px #ff0000;
    pointer-events: none;
    z-index: 1;
    filter: blur(0.5px);
  }

  /* Lightning */
  .lightning-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 100;
    transition: background 0.1s ease-out;
  }
  
  .bat-body {
    transition: opacity 0.2s ease-in-out;
  }

  .flash-active .bat-body {
    opacity: 0.8 !important;
  }

  /* ── More Gothic UI ── */
  .v-label {
    display: block; font-family: 'Cinzel', serif; font-size: 11px;
    font-weight: 700; letter-spacing: 2px; color: var(--silver);
    margin-bottom: 8px; text-transform: uppercase;
  }
  .v-input {
    width: 100%; background: rgba(10,10,16,0.6);
    border: 1px solid rgba(139,0,0,0.2); border-radius: 6px;
    padding: 12px 14px; color: var(--ivory);
    font-family: 'IM Fell English', serif; font-size: 15px; outline: none;
    transition: all 0.3s;
  }
  .v-input:focus {
    border-color: var(--crimson); background: rgba(139,0,0,0.05);
    box-shadow: 0 0 10px rgba(139,0,0,0.1);
  }
  .v-toggle {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px; background: rgba(139,0,0,0.03); border-radius: 8px;
    border: 1px solid rgba(139,0,0,0.08);
  }

  /* ── Navbar ── */
  .navbar {
    position: relative; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 60px;
    background: linear-gradient(180deg, rgba(5,5,8,0.98) 0%, rgba(10,10,16,0.92) 100%);
    border-bottom: 1px solid rgba(139,0,0,0.3);
    backdrop-filter: blur(20px);
  }

  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 20px; font-weight: 900;
    color: var(--ivory);
    text-shadow: 0 0 20px var(--crimson), 0 0 40px var(--blood);
    letter-spacing: 3px;
  }

  .nav-logo-icon {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  .nav-logo-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 10px var(--crimson));
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 15px var(--crimson), 0 0 30px var(--blood); }
    50%       { box-shadow: 0 0 25px var(--crimson), 0 0 50px var(--blood), 0 0 70px rgba(139,0,0,0.3); }
  }

  .nav-actions {
    display: flex; align-items: center; gap: 4px;
  }

  .nav-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 6px; cursor: pointer;
    font-family: 'Cinzel', serif; font-size: 11px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--silver); border: none; background: transparent;
    transition: all 0.3s ease;
  }

  .nav-btn:hover {
    color: var(--crimson);
    text-shadow: 0 0 10px var(--crimson);
    background: rgba(139,0,0,0.1);
  }

  /* ── Form Inputs ── */
  .v-input {
    width: 100%;
    background: rgba(16,16,26,0.6);
    border: 1px solid rgba(139,0,0,0.3);
    color: var(--ivory);
    padding: 12px 16px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    outline: none;
    transition: all 0.3s;
    pointer-events: auto;
  }
  .v-input:focus {
    border-color: var(--crimson);
    box-shadow: 0 0 15px rgba(220,20,60,0.2);
    background: rgba(16,16,26,0.8);
  }
  .v-label {
    display: block;
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--mist);
    margin-bottom: 8px;
    pointer-events: auto;
  }
  .v-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    transition: all 0.3s;
    pointer-events: auto;
  }
  .v-toggle:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(139,0,0,0.2);
  }

  /* ── Sidebar ── */
  .sidebar {
    position: fixed; top: 60px; left: 0; bottom: 0; width: 280px;
    background: linear-gradient(180deg, var(--obsidian) 0%, var(--void) 100%);
    border-right: 1px solid rgba(139,0,0,0.2);
    z-index: 9;
    display: flex; flex-direction: column;
  }

  .sidebar-tabs {
    display: flex; gap: 0; padding: 16px 16px 0;
  }

  .tab-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap-6px;
    gap: 6px;
    padding: 10px 14px; cursor: pointer;
    font-family: 'Cinzel', serif; font-size: 10px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase;
    border: 1px solid rgba(139,0,0,0.25); background: transparent;
    color: var(--mist); transition: all 0.3s ease;
  }

  .tab-btn:first-child { border-radius: 6px 0 0 6px; border-right: none; }
  .tab-btn:last-child  { border-radius: 0 6px 6px 0; }

  .tab-btn.active {
    background: linear-gradient(135deg, var(--blood), #5A0000);
    color: var(--ivory);
    border-color: var(--crimson);
    box-shadow: 0 0 15px rgba(139,0,0,0.4), inset 0 0 10px rgba(220,20,60,0.1);
  }

  .tab-btn:not(.active):hover {
    color: var(--crimson); border-color: rgba(139,0,0,0.5);
    background: rgba(139,0,0,0.08);
  }

  .sidebar-actions {
    display: flex; gap: 8px; padding: 12px 16px;
  }

  .action-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px; cursor: pointer;
    font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase;
    border-radius: 6px; border: none; transition: all 0.35s ease;
  }

  .action-btn.join {
    background: rgba(42,42,62,0.8);
    color: var(--silver);
    border: 1px solid rgba(139,0,0,0.25);
  }

  .action-btn.join:hover {
    background: rgba(80,0,0,0.3); color: var(--crimson);
    border-color: var(--crimson); box-shadow: 0 0 12px rgba(139,0,0,0.3);
  }

  .action-btn.nexus {
    background: linear-gradient(135deg, var(--crimson), var(--blood));
    color: var(--ivory);
    border: 1px solid var(--crimson);
    box-shadow: 0 0 15px rgba(220,20,60,0.3);
  }

  .action-btn.nexus:hover {
    box-shadow: 0 0 25px rgba(220,20,60,0.5), 0 0 50px rgba(139,0,0,0.3);
    transform: translateY(-1px);
  }

  .sidebar-empty {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 32px;
    font-family: 'IM Fell English', serif; font-style: italic;
    font-size: 13px; color: var(--mist); text-align: center;
    line-height: 1.8;
  }

  .sidebar-footer {
    padding: 16px;
  }

  .enter-orbit-card {
    padding: 14px 18px;
    background: linear-gradient(135deg, rgba(139,0,0,0.15), rgba(80,0,80,0.1));
    border: 1px solid rgba(139,0,0,0.35);
    border-radius: 10px;
    display: flex; align-items: center; gap: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative; overflow: hidden;
  }

  .enter-orbit-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent, rgba(220,20,60,0.05));
    opacity: 0; transition: opacity 0.3s;
  }

  .enter-orbit-card:hover::before { opacity: 1; }
  .enter-orbit-card:hover {
    border-color: var(--crimson);
    box-shadow: 0 0 20px rgba(139,0,0,0.3);
  }

  .orbit-icon {
    width: 36px; height: 36px;
    background: radial-gradient(circle, rgba(139,0,0,0.3), rgba(80,0,80,0.2));
    border: 1px solid rgba(139,0,0,0.5);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 10px rgba(139,0,0,0.3);
  }

  .orbit-label { font-family: 'Cinzel', serif; font-size: 10px; font-weight: 700;
    letter-spacing: 2px; color: var(--crimson); text-transform: uppercase; }
  .orbit-sub   { font-family: 'IM Fell English', serif; font-size: 10px;
    color: var(--mist); font-style: italic; margin-top: 2px; }

  /* ── Main Content ── */
  .main {
    margin-left: 280px; height: calc(100vh - 60px); position: relative; z-index: 1;
    padding: 0;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .main-content-flow {
    padding: 10px 20px 12px;
    flex: 1; display: flex; flex-direction: column;
    min-height: 0;
  }

  /* ── Nexus Chat Theme Overrides ── */
  .vamp-chat-env .nexus-chat-container { 
    background: #1c1c1c !important; 
    background-image: 
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px) !important;
    background-size: 20px 20px !important;
  }
  .vamp-chat-env .nexus-chat-header { 
    background: #1c1c1c !important; 
    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
  }
  .vamp-chat-env .nexus-chat-header * { font-family: monospace !important; color: #ffffff !important; }
  .vamp-chat-env .nxc-name { font-weight: bold !important; letter-spacing: 1px !important; }
  
  .vamp-chat-env .nxc-utility-group,
  .vamp-chat-env .nxc-telemetry-capsule {
    background: rgba(0,0,0,0.5) !important;
    border: 1px solid rgba(255,255,255,0.05) !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.6) !important;
    border-radius: 4px !important; 
  }

  .vamp-chat-env .nxc-avatar-thumb {
    animation: dim-pulse 3s infinite alternate !important;
  }
  @keyframes dim-pulse {
    0% { box-shadow: 0 0 4px rgba(255,255,255,0.2) !important; border: 1px solid rgba(255,255,255,0.1) !important; }
    100% { box-shadow: 0 0 12px rgba(255,255,255,0.5) !important; border: 1px solid rgba(255,255,255,0.3) !important; }
  }

  .vamp-chat-env .nxc-signal-bars .nxc-bar,
  .vamp-chat-env .nxc-messages { background: transparent !important; }
  
  .vamp-chat-env .nxi-shell { 
    background: rgba(5,5,8,0.98) !important; 
    border-top: 1px solid rgba(139,0,0,0.4) !important;
    backdrop-filter: blur(20px) !important;
  }
  .vamp-chat-env textarea {
    background: transparent !important;
  }
  .vamp-chat-env textarea::placeholder { color: rgba(123, 110, 138, 0.4) !important; }
  .vamp-chat-env .focus\\:border-primary\\/40:focus { border-color: var(--crimson) !important; box-shadow: 0 0 12px rgba(220,20,60,0.3) !important; background: rgba(139,0,0,0.05) !important; }

  /* Message Overrides */
  .vamp-chat-env .msg-bubble-mine { 
    background: linear-gradient(135deg, var(--blood), #5A0000) !important; 
    border: 1px solid var(--crimson) !important; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 0 15px rgba(220,20,60,0.1) !important;
    color: var(--ivory) !important;
    font-family: 'IM Fell English', serif !important;
    font-size: 15px !important;
  }
  .vamp-chat-env .msg-bubble-other { 
    background: rgba(20,20,32,0.9) !important; 
    border: 1px solid rgba(139,0,0,0.3) !important; 
    color: var(--silver) !important;
    font-family: 'IM Fell English', serif !important;
    font-size: 15px !important;
  }
  .vamp-chat-env .text-base-content\\/40 { color: var(--mist) !important; font-size: 9px !important; letter-spacing: 1px !important; }

  /* Scrollbar Override */
  .vamp-chat-env .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .vamp-chat-env .custom-scrollbar::-webkit-scrollbar-track { background: var(--void); }
  .vamp-chat-env .custom-scrollbar::-webkit-scrollbar-thumb { 
    background: var(--blood); 
    border-radius: 2px;
    box-shadow: 0 0 10px var(--crimson);
  }
  .vamp-chat-env .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--crimson); }



  .status-line {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 12px;
  }

  .status-line::before {
    content: ''; display: block; width: 40px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--crimson));
  }

  .status-text {
    font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700;
    letter-spacing: 4px; text-transform: uppercase;
    color: var(--crimson);
  }

  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--crimson);
    box-shadow: 0 0 8px var(--crimson);
    animation: status-blink 2s ease-in-out infinite;
  }

  @keyframes status-blink {
    0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--crimson); }
    50%       { opacity: 0.5; box-shadow: 0 0 2px var(--crimson); }
  }

  .welcome-title {
    font-family: 'Cinzel Decorative', cursive;
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 900; letter-spacing: 4px;
    text-transform: uppercase; line-height: 1.05;
    color: var(--ivory);
    text-shadow: 0 0 40px rgba(220,20,60,0.4), 0 2px 4px rgba(0,0,0,0.8);
    margin-bottom: 0px;
  }

  .welcome-title span {
    color: var(--crimson);
    text-shadow: 0 0 30px var(--crimson), 0 0 60px var(--blood);
  }

  .welcome-sub {
    font-family: 'IM Fell English', serif; font-style: italic;
    font-size: 14px; color: var(--silver);
    letter-spacing: 1px; margin-bottom: 16px;
  }

  /* ── Cards Grid ── */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr 1fr;
    gap: 12px;
    width: 100%;
    flex: 1;
    min-height: 0;
  }

  .card {
    background: linear-gradient(135deg, rgba(16,16,26,0.98), rgba(8,8,12,1));
    border: 1px solid rgba(139,0,0,0.25);
    border-radius: 20px;
    padding: 20px;
    height: 100%;
    cursor: pointer; position: relative; overflow: hidden;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
  }

  .card::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at top left, rgba(139,0,0,0.08), transparent 60%);
    opacity: 0; transition: opacity 0.4s;
    pointer-events: none;
  }

  .card::after {
    content: ''; position: absolute;
    inset: -1px; border-radius: 14px;
    background: linear-gradient(135deg, var(--crimson), transparent, var(--blood));
    opacity: 0; z-index: -1; transition: opacity 0.4s;
    pointer-events: none;
  }

  .card:hover::before { opacity: 1; }
  .card:hover::after  { opacity: 0.6; }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(139,0,0,0.2), 0 0 30px rgba(139,0,0,0.1);
    border-color: rgba(220,20,60,0.4);
  }

  .card.spotify {
    background: linear-gradient(160deg, rgba(14,24,14,0.99), rgba(6,12,6,1));
    border-color: rgba(20,100,20,0.3);
  }

  .card.spotify::before {
    background: radial-gradient(ellipse at top left, rgba(20,120,20,0.06), transparent 60%);
  }

  .card.spotify:hover { border-color: rgba(30,180,30,0.4); }
  .card.spotify::after {
    background: linear-gradient(135deg, #1DB954, transparent, #145a14);
  }

  /* ── Spotify internals ── */
  .spotify-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }

  .spotify-badge {
    display: flex; align-items: center; gap: 8px;
  }

  .spotify-dot {
    width: 28px; height: 28px; border-radius: 50%;
    background: #1DB954;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    box-shadow: 0 0 12px rgba(29,185,84,0.5);
  }

  .spotify-label {
    font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
    letter-spacing: 3px; color: #1DB954; text-transform: uppercase;
  }

  .expand-link {
    font-family: 'Cinzel', serif; font-size: 8px; font-weight: 700;
    letter-spacing: 2px; color: #1DB954; cursor: pointer;
    text-transform: uppercase; opacity: 0.8; transition: opacity 0.2s;
  }
  .expand-link:hover { opacity: 1; text-shadow: 0 0 8px #1DB954; }

  .spotify-track {
    display: flex; align-items: center; gap: 24px; margin-bottom: 12px;
  }


  .track-art {
    width: 56px; height: 56px; border-radius: 6px;
    background: linear-gradient(135deg, #1a3a1a, #0a200a);
    border: 1px solid rgba(29,185,84,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    flex-shrink: 0;
  }

  .track-name {
    font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700;
    color: var(--ivory); letter-spacing: 1px; margin-bottom: 4px;
  }

  .track-artist {
    font-family: 'IM Fell English', serif; font-size: 12px;
    font-style: italic; color: #4CAF50;
  }

  .spotify-controls {
    display: flex; align-items: center; justify-content: space-between;
  }

  .controls-center {
    display: flex; align-items: center; gap: 20px;
  }

  .ctrl-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(29,185,84,0.6); font-size: 14px; transition: all 0.2s;
    display: flex; align-items: center;
  }
  .ctrl-btn:hover { color: #1DB954; transform: scale(1.1); }

  .play-btn {
    width: 38px; height: 38px; border-radius: 50%;
    background: #1DB954;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: var(--void);
    box-shadow: 0 0 15px rgba(29,185,84,0.4);
    transition: all 0.25s;
  }
  .play-btn:hover { transform: scale(1.08); box-shadow: 0 0 25px rgba(29,185,84,0.6); }

  .volume-row {
    display: flex; align-items: center; gap: 8px;
  }

  .vol-icon { font-size: 12px; color: rgba(29,185,84,0.5); }

  .vol-slider {
    -webkit-appearance: none; appearance: none;
    width: 80px; height: 3px; border-radius: 2px; outline: none;
    background: linear-gradient(90deg, #1DB954 70%, rgba(29,185,84,0.2) 70%);
    cursor: pointer;
  }
  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 10px; height: 10px;
    border-radius: 50%; background: #1DB954; cursor: pointer;
  }

  /* ── Feature cards ── */
  .card-icon {
    width: 64px; height: 64px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; margin-bottom: 12px;
    position: relative;
  }

  .card-icon::after {
    content: ''; position: absolute; inset: 0; border-radius: 18px;
    box-shadow: 0 0 30px currentColor;
    opacity: 0.4;
  }

  .icon-chat    { background: linear-gradient(135deg, #7E22CE, #4C1D95); color: #D8B4FE; }
  .icon-notify  { background: linear-gradient(135deg, #EA580C, #9A3412); color: #FDBA74; }
  .icon-custom  { background: linear-gradient(135deg, #059669, #064E3B); color: #6EE7B7; }

  .card-title {
    font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700;
    letter-spacing: 3px; text-transform: uppercase;
    color: var(--ivory); margin-bottom: 4px;
  }

  .card-desc {
    font-family: 'IM Fell English', serif; font-size: 14px;
    font-style: italic; color: var(--mist); line-height: 1.8;
    max-width: 90%;
  }

  .card-arrow {
    position: absolute; bottom: 22px; right: 22px;
    color: rgba(139,0,0,0.4); font-size: 18px;
    transition: all 0.3s;
  }

  .card:hover .card-arrow {
    color: var(--crimson);
    transform: translate(2px, -2px);
    text-shadow: 0 0 8px var(--crimson);
  }

  /* Ornamental divider */
  .ornament {
    text-align: center; color: rgba(139,0,0,0.3);
    font-size: 20px; letter-spacing: 12px;
    margin-bottom: 16px;
    text-shadow: 0 0 10px var(--blood);
    user-select: none;
  }

  /* ── Hanging Bat ── */
  .hanging-bat-container {
    position: absolute; top: 0; right: 60px;
    width: 120px; height: 180px;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    padding-bottom: 25px; z-index: 20;
    animation: bat-swing 6s ease-in-out infinite alternate;
    transform-origin: top center;
    pointer-events: none;
  }

  /* Crimson hazy background */
  .mist-hazard {
    position: absolute; bottom: 10px;
    width: 80px; height: 80px;
    background: radial-gradient(circle, rgba(220,20,60,0.4) 0%, rgba(139,0,0,0.1) 50%, transparent 70%);
    filter: blur(15px);
    border-radius: 50%;
    animation: mist-pulse 4s ease-in-out infinite alternate;
    z-index: -1;
  }

  @keyframes mist-pulse {
    from { transform: scale(0.9); opacity: 0.5; }
    to { transform: scale(1.1); opacity: 0.8; }
  }

  @keyframes bat-swing {
    from { transform: rotate(-3deg); }
    to { transform: rotate(3deg); }
  }

  .refined-bat {
    fill: #080808;
    filter: drop-shadow(0 0 12px rgba(0,0,0,0.9));
    transform: rotate(180deg);
  }

  .bat-eyes {
    fill: #dc143c;
    animation: eye-blink 6s ease-in-out infinite;
    transition: opacity 0.4s ease-in-out;
  }

  @keyframes eye-blink {
    0%, 94%, 100% { opacity: 1; }
    97% { opacity: 0; }
  }

  .hanging-bat-container:hover .bat-eyes {
    opacity: 0 !important;
  }

  /* Responsive Overrides */
  @media (max-width: 768px) {
    .orbit-root { flex-direction: column; }
    .orbit-root.chat-inactive { overflow-y: auto; overflow-x: hidden; }
    .sidebar { width: 100% !important; border-right: none; flex: none; }
    .orbit-root.chat-active .sidebar { display: none !important; }
    .main { min-height: 600px; flex: none; overflow: visible !important; }
    .orbit-root.chat-active .main { min-height: auto; flex: 1; display: flex; flex-direction: column; }
    .cards-grid { grid-template-columns: 1fr; }
    .navbar { padding: 0 16px; justify-content: space-between; }
    .nav-actions { gap: 10px; }
    .nav-btn span { display: none; }
  }
`;

// ── Particle emitter ─────────────────────────────────────────────
const Particles = memo(() => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const particles = [];

        for (let i = 0; i < 18; i++) {
            const p = document.createElement("div");
            p.className = "particle";
            const size = Math.random() * 3 + 1;
            p.style.width = size + "px";
            p.style.height = size + "px";
            p.style.left = Math.random() * 100 + "vw";
            p.style.top = Math.random() * 100 + "vh";
            container.appendChild(p);
            particles.push(p);

            gsap.to(p, {
                opacity: Math.random() * 0.6 + 0.1,
                y: -(Math.random() * 200 + 100),
                x: (Math.random() - 0.5) * 80,
                duration: Math.random() * 8 + 6,
                delay: Math.random() * 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }

        return () => particles.forEach(p => p.remove());
    }, []);

    return <div ref={containerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
});


const BloodRain = memo(() => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const drops = [];

        for (let i = 0; i < 60; i++) {
            const d = document.createElement("div");
            d.className = "blood-drop-particle";
            d.style.left = Math.random() * 100 + "vw";

            const scale = Math.random() * 0.7 + 0.3;
            d.style.transform = `scale(${scale})`;
            d.style.opacity = (Math.random() * 0.5 + 0.2).toString();

            container.appendChild(d);
            drops.push(d);

            const duration = Math.random() * 1.2 + 0.6;
            const delay = Math.random() * 6;

            gsap.fromTo(d,
                { y: -100 },
                {
                    y: "115vh",
                    duration: duration,
                    delay: delay,
                    repeat: -1,
                    ease: "none"
                }
            );
        }

        return () => drops.forEach(d => d.remove());
    }, []);

    return <div ref={containerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
});

const Embers = memo(() => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const particles = [];

        for (let i = 0; i < 40; i++) {
            const p = document.createElement("div");
            p.className = "ember-particle";
            p.style.left = Math.random() * 100 + "vw";
            container.appendChild(p);
            particles.push(p);

            const duration = Math.random() * 5 + 3;
            const delay = Math.random() * 6;

            gsap.fromTo(p,
                { y: 50, x: 0, opacity: 1 },
                {
                    y: "-110vh",
                    x: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    duration: duration,
                    delay: delay,
                    repeat: -1,
                    ease: "sine.out"
                }
            );
        }

        return () => particles.forEach(p => p.remove());
    }, []);

    return <div ref={containerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
});

const Lightning = memo(() => {
    const [isFlashing, setIsFlashing] = useState(false);
    const [bolt, setBolt] = useState(null);
    const thunderRef = useRef(new Audio("https://actions.google.com/sounds/v1/weather/rolling_thunder.ogg"));

    const generatePaths = () => {
        // ... same as before
        let curX = 50;
        let curY = 0;
        let mainPath = `M ${curX} ${curY}`;
        const branches = [];

        for (let i = 0; i < 12; i++) {
            curX += (Math.random() - 0.5) * 40;
            curY += 40;
            mainPath += ` L ${curX} ${curY}`;

            if (Math.random() > 0.7) {
                let bx = curX;
                let by = curY;
                let bPath = `M ${bx} ${by}`;
                for (let j = 0; j < 4; j++) {
                    bx += (Math.random() - 0.5) * 50;
                    by += 30;
                    bPath += ` L ${bx} ${by}`;
                }
                branches.push(bPath);
            }
        }
        return [mainPath, ...branches];
    };

    useEffect(() => {
        const triggerFlash = () => {
            const sequence = async () => {
                // Check if ambient storm sound is enabled
                let soundEnabled = true;
                try {
                    const saved = localStorage.getItem('orbit_soundSettings_v1');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        soundEnabled = parsed.ambientStorm !== false;
                    }
                } catch (e) { }

                const x = Math.random() * 90 + 5;
                const scale = Math.random() * 0.5 + 0.7;
                const paths = generatePaths();
                setBolt({ x: x + "vw", scale, paths });

                setIsFlashing(true);
                if (soundEnabled) {
                    setTimeout(() => {
                        thunderRef.current.volume = 0.4; // Subtle
                        thunderRef.current.currentTime = 0;
                        thunderRef.current.play().catch(() => { });
                    }, 200);
                }

                await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
                setIsFlashing(false);

                if (Math.random() > 0.4) {
                    await new Promise(r => setTimeout(r, 80));
                    setIsFlashing(true);
                    await new Promise(r => setTimeout(r, 40));
                    setIsFlashing(false);
                }

                setTimeout(() => setBolt(null), 350);
            };

            sequence();
            setTimeout(triggerFlash, 8000 + Math.random() * 12000);
        };

        const timer = setTimeout(triggerFlash, 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isFlashing) {
            document.body.classList.add('flash-active');
        } else {
            document.body.classList.remove('flash-active');
        }
    }, [isFlashing]);

    return (
        <>
            <div
                className="lightning-overlay"
                style={{
                    background: isFlashing ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    boxShadow: isFlashing ? 'inset 0 0 150px rgba(255,255,255,0.15)' : 'none'
                }}
            />
            {isFlashing && bolt && (
                <svg
                    width="400" height="800" viewBox="-150 0 400 600"
                    style={{
                        position: 'fixed', left: bolt.x, top: -100,
                        transform: `scale(${bolt.scale})`,
                        pointerEvents: 'none', zIndex: 1, // Background
                        filter: 'drop-shadow(0 0 8px #fff) drop-shadow(0 0 15px #4a90e2)'
                    }}
                >
                    {bolt.paths.map((d, i) => (
                        <Fragment key={i}>
                            <path
                                d={d}
                                fill="none"
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth={i === 0 ? "1.5" : "0.8"}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            <path
                                d={d}
                                fill="none"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth={i === 0 ? "4" : "2"}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                style={{ filter: 'blur(3px)' }}
                            />
                        </Fragment>
                    ))}
                </svg>
            )}
        </>
    );
});

const HangingBat = memo(({ right = 60, top = 0, delay = "0s", scale = 1, opacity = 1, zIndex = 20 }) => {
    return (
        <div
            className="hanging-bat-container"
            style={{
                right, top, animationDelay: delay, zIndex,
                transform: `scale(${scale})`,
            }}
        >
            <div className="mist-hazard" style={{ opacity: opacity }} />
            <svg width="60" height="70" viewBox="0 0 100 120">
                {/* Refined Hanging Bat Body - Reveals on flash-active */}
                <g className="bat-body" style={{ opacity: 0 }}>
                    <path fill="#080808" d="M50 10C55 10 58 15 58 22C58 35 50 45 50 45C50 45 42 35 42 22C42 15 45 10 50 10Z" />
                    <path fill="#080808" d="M50 45C50 45 20 60 15 85C13 95 25 110 50 115C75 110 87 95 85 85C80 60 50 45 50 45Z" />
                    <path fill="#080808" d="M44 12L40 2L46 10Z" />
                    <path fill="#080808" d="M56 12L60 2L54 10Z" />
                </g>
                {/* Eyes - Full Opacity always */}
                <circle className="bat-eyes" cx="47" cy="22" r="2" fill="#ff0000" style={{ filter: 'drop-shadow(0 0 2px #ff0000)' }} />
                <circle className="bat-eyes" cx="53" cy="22" r="2" fill="#ff0000" style={{ filter: 'drop-shadow(0 0 2px #ff0000)' }} />
            </svg>
        </div>
    );
});

const HangingBats = memo(() => {
    return (
        <>
            {/* Background Bats (smaller, dimmer) */}
            <HangingBat right={70} top={-25} delay="2s" scale={0.6} opacity={0.4} zIndex={15} />
            <HangingBat right={140} top={-15} delay="3.5s" scale={0.7} opacity={0.4} zIndex={15} />
            <HangingBat right={210} top={-20} delay="1.8s" scale={0.65} opacity={0.3} zIndex={15} />

            {/* Foreground Bats */}
            <HangingBat right={40} top={-10} delay="0s" scale={0.8} />
            <HangingBat right={110} top={0} delay="1.2s" scale={1} />
            <HangingBat right={180} top={-5} delay="0.5s" scale={0.9} />
        </>
    );
});
// ── Main Shell Components ───────────────────────────────────────────────
const VampireTopNav = memo(({ navRef, navigate, logout, hiddenNexuses, onReveal }) => {
    return (
        <nav className="navbar" ref={navRef} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                <div className="nav-logo-icon"><img src={batLogo} alt="Orbit Bat" /></div>
                ORBIT
            </div>

            {/* ── Centered Bats Gap ── */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 60, height: '100%', pointerEvents: 'none' }}>
                {hiddenNexuses.map((nexus, i) => (
                    <div key={nexus._id} style={{ pointerEvents: 'auto' }}>
                        <HiddenNexusBat
                            nexus={nexus}
                            index={i}
                            totalCount={hiddenNexuses.length}
                            onReveal={onReveal}
                        />
                    </div>
                ))}
            </div>

            <div className="nav-actions">
                <button className="nav-btn" onClick={() => navigate("/settings")}>
                    <span>⚙</span> Settings
                </button>
                <button className="nav-btn" onClick={() => navigate("/profile")}>
                    <span>👤</span> Profile
                </button>
                <button className="nav-btn" onClick={logout}>
                    <span>↥</span> Logout
                </button>
            </div>
        </nav>
    );
});
VampireTopNav.displayName = "VampireTopNav";


const VampireSidebar = memo(({
    sidebarRef, activeTab, setActiveTab, setNexusActionView,
    isNexusesLoading, nexuses, sortedNexuses, selectedNexus, selectedNexusId,
    setSelectedNexus, setSelectedUser, nexusColors, nexusUnread,
    activeMenuId, setActiveMenuId, activeColorPickerId, setActiveColorPickerId,
    togglePin, updateColor, users, selectedUser, navigate, pinnedNexuses,
    hiddenNexuses, toggleHide, forcedTab
}) => {
    const [internalTab, setInternalTab] = useState(null);
    const currentTab = internalTab || forcedTab || activeTab;

    const handleTabClick = (t) => {
        if (forcedTab) {
            setInternalTab(t);
        } else {
            setActiveTab(t);
        }
    };

    return (
        <aside className="sidebar lm-desktop-only" ref={sidebarRef}>
            <div className="sidebar-tabs">
                <button
                    className={`tab-btn ${currentTab === "orbits" ? "active" : ""}`}
                    onClick={() => handleTabClick("orbits")}
                >
                    # ORBITS
                </button>
                <button
                    className={`tab-btn ${currentTab === "contacts" ? "active" : ""}`}
                    onClick={() => handleTabClick("contacts")}
                >
                    👤 CONTACTS
                </button>
            </div>

            <div className="sidebar-actions">
                <button className="action-btn join" onClick={() => {
                    setSelectedNexus(null);
                    setSelectedUser(null);
                    setNexusActionView("join");
                }}># JOIN</button>
                <button className="action-btn nexus" onClick={() => {
                    setSelectedNexus(null);
                    setSelectedUser(null);
                    setNexusActionView("create");
                }}>+ NEXUS</button>
            </div>

            <div className="sidebar-list custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                {(() => {
                    if (activeTab === "orbits") {
                        if (isNexusesLoading) {
                            return <div className="sidebar-empty"><em>Syncing...</em></div>;
                        }
                        if (nexuses.length === 0) {
                            return (
                                <div className="sidebar-empty">
                                    <em>"The night is vast.<br />Join or create a Nexus<br />to begin your communion."</em>
                                </div>
                            );
                        }
                        return sortedNexuses.map(n => {
                            const isSel = (selectedNexus?._id === n._id || selectedNexusId === n._id);
                            return (
                                <div
                                    key={n._id}
                                    className="sidebar-item"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setNexusActionView(null);
                                        setSelectedNexus(n);
                                        navigate(`/nexus/${n._id}`);
                                    }}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        padding: "12px 14px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid rgba(139,0,0,0.15)",
                                        transition: "all 0.2s ease",
                                        background: isSel
                                            ? "rgba(139,0,0,0.25)"
                                            : nexusColors[n._id] || "transparent",
                                        borderLeft: isSel
                                            ? "3px solid #dc143c"
                                            : "3px solid transparent",
                                        position: "relative"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                                            {n.avatar ? (
                                              <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                            ) : (
                                              (() => {
                                                const ANIMALS = ['dog', 'cat', 'bunny'];
                                                const animal = ANIMALS[parseInt((n._id || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                                                return (
                                                  <PixelAvatarBadge 
                                                    type={animal} 
                                                    state="idle" 
                                                    size={34} 
                                                    showDot={false} 
                                                    style={{ imageRendering: "pixelated" }} 
                                                  />
                                                );
                                              })()
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? "#fff" : "#F0E6D3", fontFamily: "'Cinzel',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</div>
                                            <div style={{ fontSize: 10, color: "rgba(168,155,176,0.6)", fontFamily: "serif" }}>{n.members?.length || 0} members</div>
                                        </div>
                                        {nexusUnread[n._id] > 0 && (
                                            <div style={{ background: "rgba(220,20,60,0.8)", color: "white", fontSize: 10, fontWeight: 900, padding: "1px 6px", borderRadius: 4, fontFamily: "'Cinzel',serif", boxShadow: "0 0 10px rgba(220,20,60,0.4)" }}>{nexusUnread[n._id]}</div>
                                        )}

                                        {nexusColors[n._id] && nexusColors[n._id] !== 'transparent' && (
                                            <div style={{ position: 'absolute', top: 2, right: 2, fontSize: 10 }}>📌</div>
                                        )}

                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === n._id ? null : n._id);
                                                setActiveColorPickerId(null);
                                            }}
                                            style={{ fontSize: 16, padding: "0 4px", opacity: 0.7, transition: "opacity 0.2s" }}
                                        >
                                            🦇
                                        </div>
                                    </div>

                                    {activeMenuId === n._id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: '100%', marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(139,0,0,0.2)`, display: 'flex', flexDirection: 'column', gap: 8 }}
                                        >
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveColorPickerId(activeColorPickerId === n._id ? null : n._id);
                                                    }}
                                                    style={{ flex: 1, padding: '6px', background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.4)", borderRadius: 4, fontSize: 9, color: "#F0E6D3", fontFamily: "'Cinzel', serif", letterSpacing: '1px', cursor: 'pointer' }}
                                                >
                                                    Mark 🎨
                                                </button>
                                                <button
                                                    onClick={(e) => togglePin(n._id, e)}
                                                    style={{ flex: 1, padding: '6px', background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.4)", borderRadius: 4, fontSize: 9, color: "#F0E6D3", fontFamily: "'Cinzel', serif", letterSpacing: '1px', cursor: 'pointer' }}
                                                >
                                                    {pinnedNexuses.includes(n._id) ? "Unpin 📌" : "Pin 📌"}
                                                </button>
                                                <button
                                                    onClick={(e) => toggleHide(n, e)}
                                                    style={{ flex: 1, padding: '6px', background: "rgba(80,0,0,0.3)", border: "1px solid rgba(220,20,60,0.5)", borderRadius: 4, fontSize: 9, color: "#dc143c", fontFamily: "'Cinzel', serif", letterSpacing: '1px', cursor: 'pointer' }}
                                                >
                                                    Hide 🦇
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    } else {
                        if ((users || []).length === 0) {
                            return <div className="sidebar-empty"><em>No contacts detected.</em></div>;
                        }
                        return (users || []).map(u => (
                            <div
                                key={u._id}
                                onClick={() => {
                                    setSelectedNexus(null);
                                    setNexusActionView(null);
                                    setSelectedUser(u);
                                    navigate(`/chat/${u._id}`);
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    background: (selectedUser?._id === u._id) ? "rgba(139,0,0,0.18)" : "transparent",
                                    borderLeft: (selectedUser?._id === u._id) ? "3px solid #dc143c" : "3px solid transparent",
                                    borderBottom: "1px solid rgba(139,0,0,0.05)"
                                }}
                            >
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(139,0,0,0.2)", border: "1px solid rgba(220,20,60,0.4)", overflow: "hidden", flexShrink: 0 }}>
                                    {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(220,20,60,0.8)" }}>{u.username?.[0]?.toUpperCase()}</div>}
                                </div>
                                <div style={{ fontSize: 13, color: (selectedUser?._id === u._id) ? "#fff" : "#F0E6D3", fontFamily: "'Cinzel',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
                            </div>
                        ));
                    }
                })()}
            </div>

            <div className="sidebar-footer">
                <div className="enter-orbit-card" style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                    <div className="orbit-icon">🌑</div>
                    <div>
                        <div className="orbit-label">Enter Your Orbit (Soon)</div>
                        <div className="orbit-sub">60 FPS Galaxy Engine</div>
                    </div>
                </div>
            </div>
        </aside>
    );
});
VampireSidebar.displayName = "VampireSidebar";

const VampireMobileNav = memo(({ authUser, navigate }) => (
  <div style={{
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', background: 'rgba(5,5,8,0.95)', borderBottom: '1px solid rgba(139,0,0,0.3)',
    backdropFilter: 'blur(10px)', flexShrink: 0, zIndex: 100
  }}>
    <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--blood)", cursor: "pointer" }} onClick={() => navigate("/profile")}>
      <img src={authUser?.profilePic || "/avatar.png"} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ fontFamily: "'Cinzel Decorative', cursive", fontSize: 18, color: "var(--ivory)", textShadow: "0 0 10px var(--crimson)", letterSpacing: 2 }}>ORBIT</div>
    <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: 'var(--silver)' }} onClick={() => navigate("/settings")}>⚙</div>
  </div>
));

const VampireMobileTabBar = memo(({ currentTab, onTabChange }) => (
  <div style={{
    height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    background: 'rgba(5,5,8,0.98)', borderTop: '1px solid rgba(139,0,0,0.3)',
    backdropFilter: 'blur(15px)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0, zIndex: 100
  }}>
    {[
      { id: 'orbits', label: 'ORBITS', icon: '✦' },
      { id: 'contacts', label: 'CONTACTS', icon: '👤' }
    ].map(t => {
      const active = currentTab === t.id;
      return (
        <div key={t.id} onClick={() => onTabChange(t.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          cursor: 'pointer', opacity: active ? 1 : 0.4, transition: 'all 0.3s'
        }}>
          <div style={{ 
            fontSize: 20, color: active ? 'var(--crimson)' : 'var(--silver)',
            textShadow: active ? '0 0 10px var(--crimson)' : 'none'
          }}>{t.icon}</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: active ? 'var(--ivory)' : 'var(--silver)' }}>{t.label}</div>
        </div>
      );
    })}
  </div>
));

const VampireSpotifyCard = memo(({ addCardRef, navigate }) => {
    const { 
      spotifyLinked, currentTrack, isPlaying, 
      pausePlayback, playTrack, skipNext, skipPrevious,
      positionMs, durationMs, seekTo, setVolume
    } = useSpotifyStore();
    
    const [localPos, setLocalPos] = useState(positionMs || 0);
    const [vol, setVol] = useState(70);
  
    useEffect(() => {
      setLocalPos(positionMs || 0);
    }, [positionMs]);
  
    useEffect(() => {
      let t;
      if (isPlaying && durationMs) {
        t = setInterval(() => setLocalPos(p => Math.min(p + 1000, durationMs)), 1000);
      }
      return () => clearInterval(t);
    }, [isPlaying, durationMs]);
  
    const progress = durationMs ? (localPos / durationMs) * 100 : 0;
  
    const handleSeek = (e) => {
      e.stopPropagation();
      if (!durationMs) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      seekTo((percent / 100) * durationMs);
    };

    if (!spotifyLinked) {
        return (
            <div className="card spotify" ref={el => addCardRef && addCardRef(el, 0)} onClick={() => navigate("/spotify")}>
                <div className="spotify-header">
                    <div className="spotify-badge">
                        <div className="spotify-dot">🎵</div>
                        <span className="spotify-label">Spotify Sync</span>
                    </div>
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding: "10px 0" }}>
                   <span style={{ fontSize:22, fontWeight:700, color:"#fff" }}>Connect Spotify</span>
                   <span style={{ fontSize:14, color:"#F0E6D3", marginTop:6, fontStyle:"italic" }}>Share your listening experience</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card spotify" ref={el => addCardRef && addCardRef(el, 0)} onClick={() => navigate("/spotify")}>
            <div className="spotify-header">
                <div className="spotify-badge">
                    <div className="spotify-dot">🎵</div>
                    <span className="spotify-label">Spotify Active</span>
                </div>
                <span className="expand-link">EXPAND</span>
            </div>

            <div className="spotify-track">
                {currentTrack?.imageUrl ? (
                    <img src={currentTrack.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit:"cover" }} />
                ) : (
                    <div className="track-art">🎼</div>
                )}
                <div style={{ minWidth:0 }}>
                    <div className="track-name" style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentTrack ? currentTrack.name : "Orbit Anthems"}</div>
                    <div className="track-artist" style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentTrack ? currentTrack.artist : "Premium Audio"}</div>
                </div>
            </div>

            <div className="spotify-controls" style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
                    <div className="controls-center" style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <button className="ctrl-btn" onClick={(e) => { e.stopPropagation(); skipPrevious(); }}>⏮</button>
                        <button
                            className="play-btn"
                            onClick={(e) => { e.stopPropagation(); isPlaying ? pausePlayback() : playTrack(); }}
                        >
                            {isPlaying ? "⏸" : "▶"}
                        </button>
                        <button className="ctrl-btn" onClick={(e) => { e.stopPropagation(); skipNext(); }}>⏭</button>
                    </div>
                    <div className="volume-row" style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span className="vol-icon">🔊</span>
                        <input
                            className="vol-slider" type="range"
                            min="0" max="100" value={vol}
                            onClick={(e) => e.stopPropagation()}
                            onChange={e => {
                                setVol(e.target.value);
                                if (setVolume) setVolume(e.target.value);
                            }}
                            style={{
                                background: `linear-gradient(90deg, #1DB954 ${vol}%, rgba(29,185,84,0.2) ${vol}%)`,
                                width: '60px'
                            }}
                        />
                    </div>
                </div>
                {/* Progress Bar */}
                <div onClick={handleSeek} style={{ width:"100%", height:4, background:"rgba(0,0,0,0.4)", borderRadius:2, cursor:"pointer", position:"relative" }}>
                    <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${progress}%`, background:"#dc143c", borderRadius:2, transition:"width 1s linear" }} />
                </div>
            </div>
        </div>
    );
});
VampireSpotifyCard.displayName = "VampireSpotifyCard";

// ── Hidden Nexus Bat ───────────────────────────────────────────────────────
const HiddenNexusBat = memo(({ nexus, onReveal, index, totalCount }) => {
    const [grabbed, setGrabbed] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const domRef = useRef(null);
    const offsetRef = useRef({ ox: 0, oy: 0 });
    const clickTimerRef = useRef(null);
    const pendingRevealRef = useRef(false);

    useEffect(() => {
        if (!grabbed) return;
        const onMove = (e) => {
            setPos({ x: e.clientX - offsetRef.current.ox, y: e.clientY - offsetRef.current.oy });
        };
        const onUp = () => setGrabbed(false);
        
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [grabbed]);

    const handleMouseDown = (e) => {
        // detail === 2 means second click of a double-click
        if (e.detail === 2) {
            e.preventDefault();
            e.stopPropagation();
            pendingRevealRef.current = false;
            clearTimeout(clickTimerRef.current);

            const rect = domRef.current.getBoundingClientRect();
            const currentX = rect.left;
            const currentY = rect.top;
            
            // Set initial drag pos to current physical screen pos
            setPos({ x: currentX, y: currentY });
            offsetRef.current = { ox: e.clientX - currentX, oy: e.clientY - currentY };
            setGrabbed(true);
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (grabbed) return; 
        
        pendingRevealRef.current = true;
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = setTimeout(() => {
            if (pendingRevealRef.current) onReveal(nexus._id);
        }, 250);
    };

    return (
        <div
            ref={domRef}
            style={{
                position: grabbed ? 'fixed' : 'relative',
                left: grabbed ? pos.x : 'auto',
                top: grabbed ? pos.y : 'auto',
                zIndex: 9999,
                cursor: grabbed ? 'grabbing' : 'pointer',
                userSelect: 'none',
                touchAction: 'none',
                filter: grabbed
                    ? 'drop-shadow(0 0 20px #dc143c) drop-shadow(0 0 40px rgba(220,20,60,0.6))'
                    : 'drop-shadow(0 0 6px rgba(220,20,60,0.4))',
                transition: grabbed ? 'none' : 'filter 0.3s',
                width: 64,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onDragStart={(e) => e.preventDefault()}
        >
            <svg width="64" height="26" viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg">
                <path fill="#dc143c" d="
                    M180,105 L186,97 L193,88
                    C200,81 212,77 226,74
                    C242,70 258,69 272,77
                    C281,65 296,55 322,50
                    C303,33 280,30 262,44
                    C254,33 241,24 227,32
                    L210,58 L200,74 L191,86 L184,95
                    L180,105
                    L176,95 L169,86 L160,74 L150,58
                    L133,32 C119,24 106,33 98,44
                    C80,30 57,33 38,50
                    C64,55 79,65 88,77
                    C102,69 118,70 134,74
                    C148,77 160,81 167,88
                    L174,97 Z
                "/>
                <polygon points="163,64 148,24 172,58" fill="#dc143c"/>
                <polygon points="197,64 212,24 188,58" fill="#dc143c"/>
                <ellipse cx="180" cy="72" rx="22" ry="22" fill="#dc143c"/>
                <polygon points="164,70 170,62 174,72 168,75" fill="#0a0000"/>
                <polygon points="196,70 190,62 186,72 192,75" fill="#0a0000"/>
                <polygon points="173,90 180,104 187,90 180,86" fill="#0a0000" opacity="0.45"/>
            </svg>
        </div>
    );
});
HiddenNexusBat.displayName = "HiddenNexusBat";


const VampireMobileDash = memo(({ 
    nexuses, selectedNexus, setSelectedNexus, navigate, 
    showAddMenu, setShowAddMenu, setNexusActionView,
    addCardRef, isPlaying, setIsPlaying, volume, setVolume
}) => {
    return (
        <div style={{ padding: "24px 20px" }}>
            <div className="status-line">
                <span className="status-text">Status: Online</span>
                <span className="status-dot" />
            </div>

            <h1 className="welcome-title" style={{ fontSize: 28, marginTop: 12 }}>
                Welcome to <span>Orbit</span>
            </h1>
            
            <div className="ornament" style={{ margin: "16px 0", textAlign: 'left' }}>✦ ✧ ✦</div>

            <div style={{ marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div className="vamp-scroll-hide" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, flex: 1, WebkitOverflowScrolling: 'touch' }}>
                {nexuses?.map((n) => {
                    const isActive = selectedNexus?._id === n._id;
                    const initials = (n.name || "?").slice(0, 2).toUpperCase();
                    const avatarSrc = n.avatar || n.profilePic || n.image;
                    return (
                    <div
                        key={n._id}
                        onClick={() => { setSelectedNexus(n); navigate(`/nexus/${n._id}`); }}
                        style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", width: 60 }}
                    >
                        <div style={{
                        width: 60, height: 60, borderRadius: "50%",
                        border: isActive ? "3px solid #ff0000" : "2px solid rgba(139,0,0,0.4)",
                        boxShadow: isActive
                            ? "0 0 10px #ff0000, 0 0 20px rgba(255,0,0,0.7)"
                            : "none",
                        overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? "var(--obsidian)" : "rgba(10,0,0,0.85)",
                        animation: isActive ? "vamp-neon-pulse 2s ease-in-out infinite" : "none",
                        transition: "all 0.3s ease",
                        }}>
                        {avatarSrc ? (
                            <img src={avatarSrc} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ fontSize: 16, fontWeight: 700, color: isActive ? "#ff3333" : "rgba(139,0,0,0.4)", fontFamily: "'Cinzel', serif" }}>{initials}</div>
                        )}
                        </div>
                        <div style={{ fontFamily: 'Cinzel', fontSize: 8, color: isActive ? "#ff3333" : "var(--mist)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{n.name}</div>
                    </div>
                    );
                })}
                </div>

                <div style={{ position: "relative", flexShrink: 0 }}>
                <div onClick={() => setShowAddMenu(v => !v)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", width: 60 }}>
                    <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    border: "2px dashed var(--blood)",
                    background: "rgba(139,0,0,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--blood)", fontSize: 24, animation: "vamp-add-neon 2.5s ease-in-out infinite",
                    }}>
                    {showAddMenu ? "×" : "+"}
                    </div>
                    <div style={{ fontFamily: 'Cinzel', fontSize: 8, color: "var(--blood)" }}>{showAddMenu ? "CLOSE" : "ADD"}</div>
                </div>

                {showAddMenu && (
                    <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#0a0000", border: "1.2px solid var(--blood)",
                    borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.9)",
                    padding: "8px 0", zIndex: 1000, minWidth: 150,
                    animation: "vamp-popup-slide 0.2s ease-out"
                    }}>
                    <div onClick={() => { setNexusActionView("join"); setShowAddMenu(false); }} style={{ padding: "10px 16px", fontSize: 12, color: "var(--silver)", cursor: "pointer" }}>✦ Join Nexus</div>
                    <div onClick={() => { setNexusActionView("create"); setShowAddMenu(false); }} style={{ padding: "10px 16px", fontSize: 12, color: "var(--silver)", cursor: "pointer" }}>✦ Create Nexus</div>
                    </div>
                )}
                </div>
            </div>

            <div className="cards-grid">
                <VampireSpotifyCard addCardRef={addCardRef} navigate={navigate} />
                <div className="card" style={{ opacity: 0.6 }}>
                    <div className="card-icon icon-chat" style={{ width: 48, height: 48, fontSize: 24 }}>🎮</div>
                    <div className="card-title" style={{ fontSize: 14 }}>Orbit Games</div>
                </div>
                <div className="card">
                    <div className="card-icon icon-notify" style={{ width: 48, height: 48, fontSize: 24 }}>🔔</div>
                    <div className="card-title" style={{ fontSize: 14 }}>Alerts</div>
                </div>
            </div>
        </div>
    );
});

export default function OrbitVampire({ children }) {
  return <VampireThemeLayout children={children} />;
}

export function VampireProfile() {
    const navigate = useNavigate();
    const { authUser, updateProfile } = useAuthStore();
    const [draftBio, setDraftBio] = useState(authUser?.bio || "");

    return (
        <OrbitVampire>
            <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
                <h1 className="v-label" style={{ fontSize: 24, marginBottom: 20 }}>VAMPIRE PROFILE</h1>
                <div className="card" style={{ padding: 30 }}>
                    <div style={{ display: "flex", gap: 30, alignItems: "center", marginBottom: 30 }}>
                        <img src={authUser?.profilePic || "/avatar.png"} style={{ width: 100, height: 100, borderRadius: "50%", border: "2px solid var(--crimson)" }} alt="avatar" />
                        <h2 className="v-label" style={{ fontSize: 32 }}>{authUser?.username}</h2>
                    </div>
                    <textarea
                        className="v-input"
                        value={draftBio}
                        onChange={e => setDraftBio(e.target.value)}
                        style={{ height: 120, marginBottom: 20, resize: "none" }}
                        placeholder="Enter your eternal bio..."
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="nav-btn" onClick={() => updateProfile({ bio: draftBio })} style={{ background: "var(--crimson)", color: "white" }}>SAVE RITUAL</button>
                        <button className="nav-btn" onClick={() => navigate("/")}>BACK</button>
                    </div>
                </div>
            </div>
        </OrbitVampire>
    );
}

export function VampireSettings({
  activeSection, setActiveSection,
  draftDisplayName, setDraftDisplayName,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset, navigate
}) {
    const sections = [
        { id: "profile", label: "IDENTITY" },
        { id: "sound", label: "AUDIO" },
    ];

    return (
        <div className="vamp-theme-root">
            <style>{style}</style>
            <div className="orbit-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px 32px', overflow: 'hidden', position: 'relative', zIndex: 500 }}>
                <div className="bg-atmosphere" />
                <div className="blood-drip" />
                <BloodRain />
                <Embers />
                <Lightning />
                <Particles />

                {/* Top Nav */}
                <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                    <div className="nav-logo">
                        <div className="nav-logo-icon"><img src={batLogo} alt="Orbit Bat" /></div>
                        ORBIT <span style={{ fontSize: 12, color: 'var(--mist)', marginLeft: 15, letterSpacing: '4px' }}>ACCOUNT SETTINGS</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="nav-btn" onClick={() => navigate('')} style={{ border: '1px solid rgba(139,0,0,0.3)', padding: '8px 16px', borderRadius: '4px' }}>
                            <span>◀</span> GO BACK
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 20, flex: 1, zIndex: 10, position: 'relative', padding: 0, marginLeft: 0, minHeight: 0, overflow: 'hidden' }}>
                    <HangingBats />

                    {/* Sidebar */}
                    <div className="card" style={{ width: 280, padding: 24, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", height: '100%', minHeight: 0, flexShrink: 0 }}>
                        {[
                            { id: "profile", label: "IDENTITY", icon: "🦇" },
                            { id: "sound", label: "AUDIO", icon: "🎻" },
                            { id: "appearance", label: "VISUALS", icon: "👁️" },
                            { id: "notifications", label: "ALERTS", icon: "🩸" },
                            { id: "orbit", label: "ENGINE", icon: "⛓️" },
                        ].map(tab => (
                            <button key={tab.id} type="button" onClick={() => setActiveSection(activeSection === tab.id ? null : tab.id)}
                                style={{
                                    width: "100%", textAlign: "left", padding: "16px 20px", position: "relative", zIndex: 20,
                                    background: activeSection === tab.id ? "linear-gradient(135deg, rgba(139,0,0,0.2), rgba(139,0,0,0.05))" : "transparent",
                                    border: "1px solid", borderColor: activeSection === tab.id ? "var(--crimson)" : "transparent",
                                    borderRadius: 8, color: activeSection === tab.id ? "var(--ivory)" : "var(--mist)",
                                    fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "2px",
                                    cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 14
                                }}>
                                <span style={{ fontSize: 18, color: activeSection === tab.id ? "var(--crimson)" : "var(--mist)", pointerEvents: "none" }}>{tab.icon}</span>
                                <span style={{ pointerEvents: "none" }}>{tab.label}</span>
                            </button>
                        ))}
                        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                            <button onClick={handleReset} disabled={!isDirty} style={{ width: "100%", padding: "14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: isDirty ? "var(--ivory)" : "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel', serif", cursor: isDirty ? "pointer" : "default", letterSpacing: "2px", transition: "all 0.3s" }}>RESET</button>
                            <button onClick={handleSave} disabled={!isDirty} style={{ width: "100%", padding: "14px", borderRadius: 8, background: isDirty ? "linear-gradient(135deg, var(--crimson), var(--blood))" : "rgba(139,0,0,0.1)", border: isDirty ? "1px solid var(--crimson)" : "1px solid rgba(139,0,0,0.2)", color: isDirty ? "var(--ivory)" : "rgba(220,20,60,0.3)", fontWeight: 900, fontSize: 12, fontFamily: "'Cinzel', serif", cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? "0 0 15px rgba(220,20,60,0.4)" : "none", letterSpacing: "2px", transition: "all 0.3s" }}>COMMIT</button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="card" style={{ flex: 1, padding: '40px 40px 100px', overflowY: "auto", height: '100%', minHeight: 0 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--crimson)", fontFamily: "'Cinzel', serif", marginBottom: 32, textShadow: "0 0 10px rgba(220,20,60,0.4)", letterSpacing: "4px" }}>
                            {activeSection?.toUpperCase()}
                        </h2>

                        {activeSection === "profile" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                <div>
                                    <div className="v-label">DISPLAY ALIAS (USERNAME)</div>
                                    <input
                                        className="v-input" type="text"
                                        value={draftDisplayName}
                                        onChange={e => setDraftDisplayName(e.target.value)}
                                        placeholder="Your public username..."
                                    />
                                    <div style={{ fontSize: 10, color: 'var(--mist)', marginTop: 8 }}>This changes your global username on Orbit.</div>
                                </div>
                                <div>
                                    <div className="v-label">PERSONAL BIO</div>
                                    <textarea
                                        className="v-input" rows={6}
                                        style={{ resize: 'none' }}
                                        value={draftBio}
                                        onChange={e => setDraftBio(e.target.value)}
                                        placeholder="Write about yourself..."
                                    />
                                </div>
                                <div className="v-toggle" onClick={() => setDraftShowOnlineStatus(!draftShowOnlineStatus)} style={{ cursor: 'pointer' }}>
                                    <div style={{ fontSize: 13, color: 'var(--mist)' }}>SHOW ONLINE STATUS</div>
                                    <button type="button" style={{ color: draftShowOnlineStatus ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftShowOnlineStatus ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "sound" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <div className="v-label">VOLUME CONTROL</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                        <input type="range" style={{ flex: 1, accentColor: 'var(--crimson)', cursor: 'pointer' }} min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={e => {
                                            const vol = parseFloat(e.target.value);
                                            setDraftSoundSettings({ ...draftSoundSettings, volume: vol });
                                            try { useSettingsStore.getState().updateSetting('sound.volume', vol); } catch (_) { }
                                        }} />
                                        <span style={{ color: 'var(--ivory)', fontFamily: 'Cinzel', width: 40 }}>{Math.round(draftSoundSettings.volume * 100)}%</span>
                                    </div>
                                </div>
                                <div className="v-toggle" onClick={() => {
                                    const v = !draftSoundSettings.effectsEnabled;
                                    setDraftSoundSettings({ ...draftSoundSettings, effectsEnabled: v });
                                    try { useSettingsStore.getState().updateSetting('sound.enabled', v); } catch (_) { }
                                }} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>ENABLE SOUND EFFECTS</div>
                                    <button type="button" style={{ color: draftSoundSettings.effectsEnabled ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftSoundSettings.effectsEnabled ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function VampireSpotify() {
    const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
    return (
        <OrbitVampire>
            <div style={{ padding: 40, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
                <h2 className="v-label" style={{ fontSize: 32, marginBottom: 40 }}>NOCTURNAL HARMONY</h2>
                <div className="card" style={{ padding: 40 }}>
                    {!spotifyLinked ? (
                        <button className="nav-btn" onClick={() => spotifyService.initiateLogin()} style={{ background: "#1DB954", color: "black", borderColor: "#1DB954" }}>LINK SPOTIFY</button>
                    ) : (
                        <div>
                            <img src={currentTrack?.imageUrl || "/spotify.png"} style={{ width: 280, height: 280, borderRadius: "50%", border: "4px solid var(--crimson)", marginBottom: 30 }} alt="track art" />
                            <h3 className="v-label" style={{ fontSize: 24, marginBottom: 10 }}>{currentTrack?.name || "Awaiting Signal..."}</h3>
                            <p className="v-label" style={{ color: "var(--mist)", marginBottom: 30 }}>{currentTrack?.artist || "Unknown Frequency"}</p>
                            <button onClick={() => isPlaying ? pausePlayback() : playTrack()} className="play-btn" style={{ margin: "0 auto", width: 80, height: 80, fontSize: 32, background: "var(--crimson)", borderRadius: "50%", border: "none", color: "white", cursor: "pointer" }}>{isPlaying ? "⏸" : "▶"}</button>
                        </div>
                    )}
                </div>
            </div>
        </OrbitVampire>
    );
}
