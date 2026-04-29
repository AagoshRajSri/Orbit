import React, { useEffect, useRef, useState, Fragment, useMemo, memo } from "react";
import toast from "react-hot-toast";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { createPortal } from "react-dom";
import { useThemeStore } from "../store/useThemeStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { THEMES, THEME_LABELS } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { spotifyService } from "../services/spotifyService";
import { API_URL } from "../config";
import batLogo from "../bat.svg";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import NexusActionOverlay from "../components/NexusActionOverlay";

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
  .vamp-chat-env .focus\:border-primary\/40:focus { border-color: var(--crimson) !important; box-shadow: 0 0 12px rgba(220,20,60,0.3) !important; background: rgba(139,0,0,0.05) !important; }

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
  .vamp-chat-env .text-base-content\/40 { color: var(--mist) !important; font-size: 9px !important; letter-spacing: 1px !important; }

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
    hiddenNexuses, toggleHide
}) => {
    return (
        <aside className="sidebar" ref={sidebarRef}>
            <div className="sidebar-tabs">
                <button
                    className={`tab-btn ${activeTab === "orbits" ? "active" : ""}`}
                    onClick={() => setActiveTab("orbits")}
                >
                    # ORBITS
                </button>
                <button
                    className={`tab-btn ${activeTab === "contacts" ? "active" : ""}`}
                    onClick={() => setActiveTab("contacts")}
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
                                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(139,0,0,0.3)", border: "1.5px solid rgba(220,20,60,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, overflow: "hidden" }}>
                                            {n.avatar ? <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : "⬡"}
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
                <div className="enter-orbit-card" onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))}>
                    <div className="orbit-icon">🌑</div>
                    <div>
                        <div className="orbit-label">Enter Your Orbit</div>
                        <div className="orbit-sub">60 FPS Galaxy Engine</div>
                    </div>
                </div>
            </div>
        </aside>
    );
});
VampireSidebar.displayName = "VampireSidebar";

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

export default function OrbitVampire({ children }) {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
    const nexusSelected = Boolean(selectedNexus || selectedNexusId);
    const { users, selectedUser, setSelectedUser } = useChatStore();
    const [activeTab, setActiveTab] = useState("orbits");

    const [pinnedNexuses, setPinnedNexuses] = useState(() => {
        return JSON.parse(localStorage.getItem('vampire_pinned_nexuses') || '[]');
    });
    const [nexusColors, setNexusColors] = useState(() => {
        return JSON.parse(localStorage.getItem('vampire_nexus_colors') || '{}');
    });
    const [hiddenNexuses, setHiddenNexuses] = useState(() => {
        return JSON.parse(localStorage.getItem('vampire_hidden_nexuses') || '[]');
    });
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [activeColorPickerId, setActiveColorPickerId] = useState(null);

    const togglePin = (id, e) => {
        e.stopPropagation();
        const next = pinnedNexuses.includes(id) ? pinnedNexuses.filter(pid => pid !== id) : [...pinnedNexuses, id];
        setPinnedNexuses(next);
        localStorage.setItem('vampire_pinned_nexuses', JSON.stringify(next));
        setActiveMenuId(null);
    };

    const updateColor = (id, color, e) => {
        e.stopPropagation();
        const next = { ...nexusColors, [id]: color };
        setNexusColors(next);
        localStorage.setItem('vampire_nexus_colors', JSON.stringify(next));
        setActiveColorPickerId(null);
        setActiveMenuId(null);
    };

    const toggleHide = (nexus, e) => {
        e.stopPropagation();
        const id = nexus._id;
        const isHidden = hiddenNexuses.some(h => h._id === id);
        
        if (!isHidden && hiddenNexuses.length >= 3) {
            toast.error("Vampire Limit: Only 3 bats allowed in the shadows.", {
                style: { background: '#1a0000', color: '#dc143c', border: '1px solid #dc143c', fontFamily: 'Cinzel' }
            });
            return;
        }

        const next = isHidden
            ? hiddenNexuses.filter(h => h._id !== id)
            : [...hiddenNexuses, { _id: id, name: nexus.name }];
        setHiddenNexuses(next);
        localStorage.setItem('vampire_hidden_nexuses', JSON.stringify(next));
        setActiveMenuId(null);
    };

    const sortedNexuses = useMemo(() => {
        const hiddenIds = hiddenNexuses.map(h => h._id);
        return [...nexuses]
            .filter(n => !hiddenIds.includes(n._id))
            .sort((a, b) => {
                const aPinned = pinnedNexuses.includes(a._id);
                const bPinned = pinnedNexuses.includes(b._id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return 0;
            });
    }, [nexuses, pinnedNexuses, hiddenNexuses]);

    useEffect(() => {
        const handleGlobalClick = () => {
            setActiveMenuId(null);
            setActiveColorPickerId(null);
        };
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(70);

    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subRef = useRef(null);
    const ornRef = useRef(null);
    const cardsRef = useRef([]);
    const sidebarRef = useRef(null);
    const navRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Nav sweep in
            if (navRef.current) gsap.fromTo(navRef.current,
                { y: -80, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
            );

            // Sidebar slide
            if (sidebarRef.current) gsap.fromTo(sidebarRef.current,
                { x: -320, opacity: 0 },
                { x: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: 0.2 }
            );

            // Title sequence
            const tl = gsap.timeline({ delay: 0.4 });

            if (titleRef.current) tl.fromTo(titleRef.current,
                { y: 60, opacity: 0, skewX: -4 },
                { y: 0, opacity: 1, skewX: 0, duration: 1.2, ease: "power4.out" }
            );
            if (subRef.current) tl.fromTo(subRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.5"
            );
            if (ornRef.current) tl.fromTo(ornRef.current,
                { opacity: 0, letterSpacing: "40px" },
                { opacity: 1, letterSpacing: "12px", duration: 1, ease: "power2.out" },
                "-=0.3"
            );

            cardsRef.current.forEach((card, i) => {
                if (!card) return;
                gsap.fromTo(card,
                    { y: 50, opacity: 0, scale: 0.95 },
                    {
                        y: 0, opacity: 1, scale: 1,
                        duration: 0.8, ease: "power3.out",
                        delay: 0.8 + i * 0.12
                    }
                );

                // Hover shimmer
                const enter = () => gsap.to(card, { scale: 1.02, duration: 0.3, ease: "power2.out" });
                const leave = () => gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
                card.addEventListener("mouseenter", enter);
                card.addEventListener("mouseleave", leave);
                return () => {
                    card.removeEventListener("mouseenter", enter);
                    card.removeEventListener("mouseleave", leave);
                };
            });
        });

        return () => ctx.revert();
    }, []);

    const addCardRef = (el, i) => { cardsRef.current[i] = el; };

    return (
        <div className="vamp-theme-root">
            <style>{style}</style>
            <div className="orbit-root">
                <div className="bg-atmosphere" />
                <div className="blood-drip" />
                <BloodRain />
                <Embers />
                <Lightning />
                <Particles />

                {/* ── Navbar ── */}
                <VampireTopNav
                    navRef={navRef}
                    navigate={navigate}
                    logout={logout}
                    hiddenNexuses={hiddenNexuses}
                    onReveal={(id) => {
                        const next = hiddenNexuses.filter(h => h._id !== id);
                        setHiddenNexuses(next);
                        localStorage.setItem('vampire_hidden_nexuses', JSON.stringify(next));
                    }}
                />

                {/* ── Sidebar ── */}
                <VampireSidebar
                    sidebarRef={sidebarRef}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setNexusActionView={setNexusActionView}
                    isNexusesLoading={isNexusesLoading}
                    nexuses={nexuses}
                    sortedNexuses={sortedNexuses}
                    selectedNexus={selectedNexus}
                    selectedNexusId={selectedNexusId}
                    setSelectedNexus={setSelectedNexus}
                    setSelectedUser={setSelectedUser}
                    nexusColors={nexusColors}
                    nexusUnread={nexusUnread}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                    activeColorPickerId={activeColorPickerId}
                    setActiveColorPickerId={setActiveColorPickerId}
                    togglePin={togglePin}
                    updateColor={updateColor}
                    users={users}
                    selectedUser={selectedUser}
                    navigate={navigate}
                    pinnedNexuses={pinnedNexuses}
                    hiddenNexuses={hiddenNexuses}
                    toggleHide={toggleHide}
                />

                {/* ── Main ── */}
                <main className="main" ref={heroRef}>
                    {children ? (
                        <div style={{ flex: 1, position: 'relative', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
                            {children}
                        </div>
                    ) : nexusActionView ? (
                        <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
                            <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
                        </div>
                    ) : (selectedNexus || selectedNexusId) ? (
                        <div className="vamp-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
                            <UniversalChatContainer key={selectedNexus?._id || selectedNexusId} type="nexus" />
                        </div>
                    ) : selectedUser ? (
                        <div className="vamp-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
                            <UniversalChatContainer key={selectedUser?._id} type="dm" />
                        </div>
                    ) : (
                        <div className="main-content-flow">
                            <div className="status-line">
                                <span className="status-text">Status: Online</span>
                                <span className="status-dot" />
                            </div>

                            <h1 className="welcome-title" ref={titleRef}>
                                Welcome to <span>Orbit</span>
                            </h1>
                            <p className="welcome-sub" ref={subRef}>
                                Choose a pathway to begin your dark mission.
                            </p>

                            <div className="ornament" ref={ornRef}>✦ ✧ ✦ ✧ ✦</div>

                            <HangingBats />

                            <div className="cards-grid">
                                <VampireSpotifyCard
                                    addCardRef={addCardRef}
                                    isPlaying={isPlaying}
                                    setIsPlaying={setIsPlaying}
                                    volume={volume}
                                    setVolume={setVolume}
                                    navigate={navigate}
                                />

                                {/* Start Chatting */}
                                <div className="card" ref={el => addCardRef(el, 1)} onClick={() => { setActiveTab("orbits"); setNexusActionView(null); }}>
                                    <div className="card-icon icon-chat">💬</div>
                                    <div className="card-title">Start Chatting</div>
                                    <div className="card-desc">
                                        Select a Constellation or open a private channel into the dark beyond.
                                    </div>
                                    <span className="card-arrow">↗</span>
                                </div>

                                {/* Get Notifications */}
                                <div className="card" ref={el => addCardRef(el, 2)}>
                                    <div className="card-icon icon-notify">🔔</div>
                                    <div className="card-title">Get Notifications</div>
                                    <div className="card-desc">
                                        Stay vigilant with real-time alerts and whispers from the ether.
                                    </div>
                                    <span className="card-arrow">↗</span>
                                </div>

                                {/* Customize */}
                                <div className="card" ref={el => addCardRef(el, 3)} onClick={() => navigate("/settings")}>
                                    <div className="card-icon icon-custom">⚙</div>
                                    <div className="card-title">Customize</div>
                                    <div className="card-desc">
                                        Configure your orbit behavior, rituals, and personal dark preferences.
                                    </div>
                                    <span className="card-arrow">↗</span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

            </div>

        </div>
    );
}


export function VampireProfile() {
    const navigate = useNavigate();
    const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();

    // ── Edit mode ─────────────────────────────────────────────────────
    const [isRitualMode, setIsRitualMode] = useState(false);

    // ── Profile draft fields ──────────────────────────────────────────
    const [draftUsername, setDraftUsername] = useState(authUser?.username || "");
    const [draftBio, setDraftBio] = useState(authUser?.bio || "");
    const [selectedImg, setSelectedImg] = useState(null);
    const [previewImg, setPreviewImg] = useState(null);

    // Sync drafts from authUser when NOT actively editing
    useEffect(() => {
        if (!isRitualMode) {
            setDraftUsername(authUser?.username || "");
            setDraftBio(authUser?.bio || "");
        }
    }, [authUser?.username, authUser?.bio]); // eslint-disable-line react-hooks/exhaustive-deps

    const profileDirty =
        draftUsername.trim() !== (authUser?.username || "") ||
        draftBio !== (authUser?.bio || "") ||
        selectedImg !== null;

    // ── Grimoire Records — persisted to localStorage ──────────────────
    const [records, setRecords] = useState(() => {
        try {
            const s = localStorage.getItem('vampire_grimoire_records');
            return s ? JSON.parse(s) : [
                { id: 1, title: "The First Eclipse", content: "I remember the day the sun died. The shadows grew long, and the hunger began." },
                { id: 2, title: "Ritual of the Blood Moon", content: "The clan gathered at the obsidian altar. We swore the eternal oath." },
            ];
        } catch { return []; }
    });
    useEffect(() => { localStorage.setItem('vampire_grimoire_records', JSON.stringify(records)); }, [records]);

    const [isAdding, setIsAdding] = useState(false);
    const [editId, setEditId] = useState(null);
    const [draftTitle, setDraftTitle] = useState("");
    const [draftContent, setDraftContent] = useState("");

    // ── Decorative fields — persisted to localStorage ─────────────────
    const [bloodline, setBloodline] = useState(() => localStorage.getItem('vampire_bloodline') || "ELDER BLOODLINE");
    const [stats, setStats] = useState(() => {
        try { const s = localStorage.getItem('vampire_stats'); return s ? JSON.parse(s) : [{ label: "DARKNESS", value: 85, color: '#4b0082' }, { label: "VITALITY", value: 62, color: '#8b0000' }, { label: "MYSTIQUE", value: 74, color: '#4a4a4a' }]; } catch { return []; }
    });
    const [affiliations, setAffiliations] = useState(() => {
        try { const a = localStorage.getItem('vampire_affiliations'); return a ? JSON.parse(a) : [{ icon: "🦇", title: "BAT LORD", sub: "CLAN LEADER" }, { icon: "🌑", title: "LUNAR", sub: "ECLIPSED" }, { icon: "⛓️", title: "BOUND", sub: "ETERNAL" }, { icon: "🧪", title: "ALCHEMY", sub: "BLOOD LAB" }]; } catch { return []; }
    });
    useEffect(() => { localStorage.setItem('vampire_bloodline', bloodline); }, [bloodline]);
    useEffect(() => { localStorage.setItem('vampire_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('vampire_affiliations', JSON.stringify(affiliations)); }, [affiliations]);

    const [newAffIcon, setNewAffIcon] = useState("🦇");
    const [newAffTitle, setNewAffTitle] = useState("");
    const [newAffSub, setNewAffSub] = useState("");
    const IS = { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(139,0,0,0.35)', color: 'var(--ivory)', borderRadius: 4, padding: '4px 8px', fontSize: 10, outline: 'none', fontFamily: "'Cinzel',serif" };

    // ── Handlers ───────────────────────────────────────────────────────
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => { setSelectedImg(reader.result); setPreviewImg(reader.result); };
    };
    const handleSaveProfile = async () => {
        if (!draftUsername.trim()) return;
        const payload = { bio: draftBio };
        if (draftUsername.trim() !== authUser?.username) payload.username = draftUsername.trim();
        if (selectedImg) payload.profilePic = selectedImg;
        await updateProfile(payload);
        setSelectedImg(null); setPreviewImg(null); setIsRitualMode(false);
    };
    const handleDiscardProfile = () => {
        setDraftUsername(authUser?.username || "");
        setDraftBio(authUser?.bio || "");
        setSelectedImg(null); setPreviewImg(null);
        setIsRitualMode(false);
    };
    const handleAddRecord = () => {
        if (!draftTitle.trim() || !draftContent.trim()) return;
        setRecords([{ id: Date.now(), title: draftTitle.trim(), content: draftContent.trim() }, ...records]);
        setDraftTitle(""); setDraftContent(""); setIsAdding(false);
    };
    const handleDeleteRecord = (id) => setRecords(records.filter(r => r.id !== id));
    const handleStartEdit = (record) => { setEditId(record.id); setDraftTitle(record.title); setDraftContent(record.content); setIsAdding(false); };
    const handleUpdateRecord = () => {
        if (!draftTitle.trim() || !draftContent.trim()) return;
        setRecords(records.map(r => r.id === editId ? { ...r, title: draftTitle.trim(), content: draftContent.trim() } : r));
        setEditId(null); setDraftTitle(""); setDraftContent("");
    };
    const handleCancelRecord = () => { setIsAdding(false); setEditId(null); setDraftTitle(""); setDraftContent(""); };

    return (
        <div className="vamp-theme-root">
            <style>{style}</style>
            <div className="orbit-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px 32px', overflow: 'hidden', position: 'relative', zIndex: 500 }}>
                <div className="bg-atmosphere" /><div className="blood-drip" />
                <BloodRain /><Embers /><Lightning /><Particles />

                {/* Top Nav */}
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
                    <div className="nav-logo">
                        <div className="nav-logo-icon" style={{ animation: 'pulse-glow 5s linear infinite' }}><img src={batLogo} alt="Orbit Bat" /></div>
                        ORBIT <span style={{ fontSize: 12, color: 'var(--mist)', marginLeft: 15, letterSpacing: '4px' }}>// CHRONICLES OF THE ANCIENT</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {isRitualMode && <span style={{ fontSize: 10, color: 'var(--crimson)', letterSpacing: '2px', fontFamily: "'Cinzel',serif" }}>◉ EDIT MODE ACTIVE</span>}
                        <button className="nav-btn" onClick={() => isRitualMode ? handleDiscardProfile() : setIsRitualMode(true)}
                            style={{ background: isRitualMode ? 'rgba(139,0,0,0.12)' : 'transparent', border: '1px solid var(--crimson)', padding: '8px 18px', borderRadius: 20 }}>
                            {isRitualMode ? "✕ CANCEL EDITS" : "✎ EDIT PROFILE"}
                        </button>
                        {isRitualMode && (
                            <button className="nav-btn" onClick={handleSaveProfile} disabled={!profileDirty || isUpdatingProfile}
                                style={{ background: profileDirty ? 'linear-gradient(135deg,var(--crimson),var(--blood))' : 'rgba(139,0,0,0.1)', border: `1px solid ${profileDirty ? 'var(--crimson)' : 'rgba(139,0,0,0.2)'}`, padding: '8px 18px', borderRadius: 20, color: profileDirty ? 'var(--ivory)' : 'rgba(220,20,60,0.3)', cursor: profileDirty ? 'pointer' : 'default', boxShadow: profileDirty ? '0 0 15px rgba(220,20,60,0.3)' : 'none', transition: 'all 0.3s' }}>
                                {isUpdatingProfile ? "SAVING..." : "✔ SAVE PROFILE"}
                            </button>
                        )}

                        <button className="nav-btn" onClick={() => navigate("/")} style={{ border: '1px solid rgba(139,0,0,0.3)', padding: '8px 18px', borderRadius: 20 }}>◀ GO BACK</button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', gap: 24, flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <HangingBats />

                    {/* Left column */}
                    <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, flexShrink: 0 }}>
                        {/* Identity card */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '28px 20px', flexShrink: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 120, height: 120, borderRadius: '50%', border: '2px solid var(--crimson)', padding: 6, background: 'linear-gradient(135deg,var(--void),#200000)', boxShadow: '0 0 30px rgba(220,20,60,0.15)' }}>
                                    <img src={previewImg || authUser?.profilePic || "/avatar.png"} alt="essence" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', filter: 'grayscale(0.3) contrast(1.1)' }} />
                                </div>
                                <label title="Change essence" style={{ position: 'absolute', bottom: 4, right: 4, width: 30, height: 30, background: isRitualMode ? 'var(--blood)' : 'rgba(139,0,0,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isRitualMode ? 'pointer' : 'not-allowed', border: '1px solid var(--crimson)', opacity: isRitualMode ? 1 : 0.4, transition: 'all 0.3s' }}>
                                    <span style={{ fontSize: 12 }}>👁️</span>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} disabled={!isRitualMode || isUpdatingProfile} />
                                </label>
                                {selectedImg && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--crimson)', animation: 'pulse-glow 1.5s infinite', pointerEvents: 'none' }} />}
                            </div>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                {isRitualMode
                                    ? <input value={draftUsername} onChange={e => setDraftUsername(e.target.value)} maxLength={32} placeholder="Name your shadow..." style={{ ...IS, fontSize: 15, letterSpacing: '2px', textAlign: 'center', fontWeight: 700, width: '100%', padding: '6px 12px', marginBottom: 8 }} />
                                    : <h2 style={{ fontSize: 20, color: 'var(--ivory)', fontFamily: "'Cinzel',serif", letterSpacing: '3px', marginBottom: 8 }}>{authUser?.username}</h2>
                                }
                                <div style={{ background: 'rgba(139,0,0,0.12)', padding: '3px 12px', borderRadius: 4, display: 'inline-block', border: '1px solid rgba(139,0,0,0.3)' }}>
                                    {isRitualMode
                                        ? <input value={bloodline} onChange={e => setBloodline(e.target.value.toUpperCase())} style={{ background: 'transparent', border: 'none', color: 'var(--crimson)', fontSize: 9, letterSpacing: '2px', fontWeight: 900, textAlign: 'center', outline: 'none', width: 140 }} />
                                        : <p style={{ color: 'var(--crimson)', fontSize: 9, letterSpacing: '2px', fontWeight: 900 }}>{bloodline}</p>
                                    }
                                </div>
                            </div>
                            <div style={{ width: '100%', padding: '0 10px' }}>
                                <div className="v-label" style={{ textAlign: 'center', marginBottom: 12, fontSize: 10 }}>SOUL RESONANCE</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {stats.map((stat, idx) => (
                                        <div key={idx}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--mist)', marginBottom: 4 }}>
                                                {isRitualMode
                                                    ? <input value={stat.label} onChange={e => { const n = [...stats]; n[idx] = { ...n[idx], label: e.target.value.toUpperCase() }; setStats(n); }} style={{ background: 'transparent', border: 'none', color: 'var(--mist)', fontSize: 9, width: '65%', outline: 'none' }} />
                                                    : <span>{stat.label}</span>}
                                                <span>{stat.value}%</span>
                                            </div>
                                            {isRitualMode
                                                ? <input type="range" min={0} max={100} value={stat.value} onChange={e => { const n = [...stats]; n[idx] = { ...n[idx], value: parseInt(e.target.value) }; setStats(n); }} style={{ width: '100%', accentColor: stat.color, cursor: 'pointer' }} />
                                                : <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}><div style={{ width: `${stat.value}%`, height: '100%', background: stat.color, boxShadow: `0 0 8px ${stat.color}`, transition: 'width 0.5s', borderRadius: 1 }} /></div>
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Affiliations */}
                        <div className="card" style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 0 }}>
                            <div className="v-label" style={{ fontSize: 10 }}>UNHOLY AFFILIATIONS</div>
                            {isRitualMode && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, background: 'rgba(139,0,0,0.05)', borderRadius: 8, border: '1px solid rgba(139,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <input value={newAffIcon} onChange={e => setNewAffIcon(e.target.value)} placeholder="🦇" style={{ ...IS, width: 38, textAlign: 'center' }} />
                                        <input value={newAffTitle} onChange={e => setNewAffTitle(e.target.value)} placeholder="Title..." style={{ ...IS, flex: 1 }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <input value={newAffSub} onChange={e => setNewAffSub(e.target.value)} placeholder="Subtitle..." style={{ ...IS, flex: 1 }} />
                                        <button onClick={() => { if (!newAffTitle.trim()) return; setAffiliations([...affiliations, { icon: newAffIcon || "🦇", title: newAffTitle.toUpperCase(), sub: newAffSub.toUpperCase() }]); setNewAffTitle(""); setNewAffSub(""); setNewAffIcon("🦇"); }} style={{ background: 'var(--blood)', border: '1px solid var(--crimson)', color: 'white', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>+</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                                {affiliations.map((badge, i) => (
                                    <div key={i} style={{ padding: 10, background: 'rgba(139,0,0,0.03)', border: '1px solid rgba(139,0,0,0.1)', borderRadius: 8, textAlign: 'center', position: 'relative' }}>
                                        {isRitualMode && <button onClick={() => setAffiliations(affiliations.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 2, right: 4, background: 'transparent', border: 'none', color: 'var(--crimson)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>}
                                        <div style={{ fontSize: 18 }}>{badge.icon}</div>
                                        <div style={{ fontSize: 8, color: 'var(--ivory)', marginTop: 5, fontWeight: 700 }}>{badge.title}</div>
                                        <div style={{ fontSize: 7, color: 'var(--mist)', marginTop: 2 }}>{badge.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Grimoire */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div className="card" style={{ flex: 1, padding: 36, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
                                <h3 className="v-label" style={{ fontSize: 14, margin: 0 }}>GRIMOIRE OF VOID</h3>
                                <span style={{ fontSize: 10, color: 'var(--crimson)', fontStyle: 'italic' }}>Est. 1422 AD</span>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, paddingRight: 8, minHeight: 0, willChange: 'scroll-position', WebkitOverflowScrolling: 'touch' }}>
                                {/* Bio */}
                                <div>
                                    {!isRitualMode && (
                                        <p style={{ fontSize: 11, color: 'var(--mist)', fontStyle: 'italic', background: 'rgba(139,0,0,0.1)', padding: 10, borderRadius: 6, border: '1px solid rgba(139,0,0,0.2)' }}>
                                            Click "✎ EDIT PROFILE" in the top navigation to change your avatar, name, email, and bio.
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label className="v-label" style={{ fontSize: 9 }}>MORTAL TIE (EMAIL)</label>
                                            <input className="v-input" type="email" value={authUser?.email || ""} disabled
                                                placeholder="Your email address"
                                                style={{ fontSize: 14, opacity: 0.7, cursor: 'not-allowed', width: '100%', padding: '10px 14px' }} />
                                            <p style={{ fontSize: 9, color: 'var(--mist)', marginTop: 4 }}>Email cannot be changed during the ritual.</p>
                                        </div>
                                        <div>
                                            <label className="v-label" style={{ fontSize: 9 }}>EXISTENTIAL BIO (THE VOID)</label>
                                            <textarea className="v-input" rows={5} value={draftBio} onChange={e => setDraftBio(e.target.value)}
                                                placeholder="Speak to the silence..." disabled={!isRitualMode}
                                                style={{ resize: 'none', lineHeight: 1.8, fontSize: 14, opacity: isRitualMode ? 1 : 0.7, cursor: isRitualMode ? 'text' : 'default' }} />
                                        </div>
                                    </div>

                                    {!isRitualMode
                                        ? null
                                        : (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                                                <button onClick={handleDiscardProfile} className="nav-btn" style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(139,0,0,0.3)', color: 'var(--mist)', borderRadius: 4, cursor: 'pointer' }}>CANCEL</button>
                                                <button onClick={handleSaveProfile} disabled={!profileDirty || isUpdatingProfile}
                                                    style={{ padding: '10px 24px', background: profileDirty ? 'var(--blood)' : 'rgba(139,0,0,0.1)', border: `1px solid ${profileDirty ? 'var(--crimson)' : 'rgba(139,0,0,0.2)'}`, color: profileDirty ? 'var(--ivory)' : 'rgba(220,20,60,0.3)', borderRadius: 4, fontFamily: "'Cinzel',serif", cursor: profileDirty ? 'pointer' : 'default', letterSpacing: '2px', boxShadow: profileDirty ? '0 0 20px rgba(139,0,0,0.3)' : 'none', transition: 'all 0.3s' }}>
                                                    {isUpdatingProfile ? "SAVING..." : "SAVE PROFILE"}
                                                </button>
                                            </div>
                                        )
                                    }
                                </div>
                                {/* Soul Metrics */}
                                <div style={{ borderTop: '1px solid rgba(139,0,0,0.1)', paddingTop: 20 }}>
                                    <label className="v-label" style={{ fontSize: 9 }}>SOUL METRICS</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 12 }}>
                                        {[{ label: "WAVES", val: "1.4K", sub: "SENT" }, { label: "RECORDS", val: records.length, sub: "ETERNAL" }, { label: "NIGHTS", val: "12", sub: "CONSECUTIVE" }].map(m => (
                                            <div key={m.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(139,0,0,0.03)', border: '1px solid rgba(139,0,0,0.08)', borderRadius: 8 }}>
                                                <div style={{ color: 'var(--ivory)', fontSize: 20, fontFamily: "'Cinzel',serif", fontWeight: 700 }}>{m.val}</div>
                                                <div style={{ color: 'var(--crimson)', fontSize: 8, letterSpacing: '2px', marginTop: 4 }}>{m.label}</div>
                                                <div style={{ color: 'var(--mist)', fontSize: 7, marginTop: 2 }}>{m.sub}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Chronicles CRUD */}
                                <div style={{ borderTop: '1px solid rgba(139,0,0,0.1)', paddingTop: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <label className="v-label" style={{ fontSize: 9, margin: 0 }}>ANCIENT RECORDS (CHRONICLES)</label>
                                        <button onClick={() => { setIsAdding(!isAdding); setEditId(null); setDraftTitle(""); setDraftContent(""); }}
                                            style={{ background: 'transparent', border: '1px solid var(--crimson)', color: 'var(--crimson)', fontSize: 10, padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
                                            {isAdding ? "CANCEL" : "+ ADD RECORD"}
                                        </button>
                                    </div>
                                    {(isAdding || editId) && (
                                        <div className="card" style={{ padding: 14, marginBottom: 14, background: 'rgba(139,0,0,0.04)', border: '1px solid rgba(139,0,0,0.15)' }}>
                                            <input className="v-input" placeholder="Chronicle Title..." style={{ marginBottom: 10, fontSize: 13 }} value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
                                            <textarea className="v-input" rows={3} placeholder="Transcribe the memory..." style={{ fontSize: 12, resize: 'none' }} value={draftContent} onChange={e => setDraftContent(e.target.value)} />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                                                <button onClick={handleCancelRecord} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--mist)', padding: '5px 12px', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
                                                <button onClick={editId ? handleUpdateRecord : handleAddRecord} disabled={!draftTitle.trim() || !draftContent.trim()}
                                                    style={{ background: draftTitle.trim() && draftContent.trim() ? 'var(--blood)' : 'rgba(139,0,0,0.2)', border: '1px solid var(--crimson)', color: 'white', padding: '5px 14px', borderRadius: 4, fontSize: 10, cursor: draftTitle.trim() && draftContent.trim() ? 'pointer' : 'default', letterSpacing: '1px' }}>
                                                    {editId ? "UPDATE CHRONICLE" : "SEAL RECORD"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {records.length === 0 && <p style={{ color: 'var(--mist)', fontStyle: 'italic', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>The void is silent. Add your first chronicle.</p>}
                                        {records.map(record => (
                                            <div key={record.id} className="card" style={{ padding: 14, position: 'relative', border: editId === record.id ? '1px solid var(--crimson)' : undefined }}>
                                                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ivory)', marginBottom: 5, letterSpacing: '1px' }}>{record.title}</div>
                                                <div style={{ fontSize: 11, color: 'var(--mist)', fontStyle: 'italic', lineHeight: 1.5 }}>{record.content}</div>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleStartEdit(record)} style={{ background: 'transparent', border: 'none', color: 'var(--mist)', cursor: 'pointer', fontSize: 10, padding: '3px 8px' }}
                                                        onMouseEnter={e => e.target.style.color = 'var(--ivory)'} onMouseLeave={e => e.target.style.color = 'var(--mist)'}>EDIT</button>
                                                    <button onClick={() => handleDeleteRecord(record.id)} style={{ background: 'transparent', border: 'none', color: 'var(--crimson)', cursor: 'pointer', fontSize: 10, padding: '3px 8px' }}>BURN</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Settings Component ───────────────────────────────────────────────
export function VampireSettings({
    activeSection, setActiveSection,
    draftTheme, setDraftTheme,
    draftDisplayName, setDraftDisplayName,
    draftBio, setDraftBio,
    draftNotifications, setDraftNotifications,
    draftShowOnlineStatus, setDraftShowOnlineStatus,
    draftOrbitBehavior, setDraftOrbitBehavior,
    draftSoundSettings, setDraftSoundSettings,
    isDirty, handleSave, handleReset, authUser, navigate
}) {
    const [focusedTheme, setFocusedTheme] = useState(draftTheme);
    const [pendingLocal, setPendingLocal] = useState(null);
    const setGlobalTheme = useThemeStore((s) => s.setTheme);

    const handleThemeClick = (id) => {
        if (id === draftTheme) return;
        setPendingLocal(id);
    };

    const handleConfirm = () => {
        if (!pendingLocal) return;
        setGlobalTheme(pendingLocal);
        setDraftTheme(pendingLocal);
        setPendingLocal(null);
    };

    const handleCancel = () => setPendingLocal(null);

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
                        ORBIT <span style={{ fontSize: 12, color: 'var(--mist)', marginLeft: 15, letterSpacing: '4px' }}>// ACCOUNT SETTINGS</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="nav-btn" onClick={() => navigate("/")} style={{ border: '1px solid rgba(139,0,0,0.3)', padding: '8px 16px', borderRadius: '4px' }}>
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
                            <button key={tab.id} type="button" onClick={() => setActiveSection(tab.id)}
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
                    <div className="card" style={{ flex: 1, padding: 40, overflowY: "auto", height: '100%', minHeight: 0 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--crimson)", fontFamily: "'Cinzel', serif", marginBottom: 32, textShadow: "0 0 10px rgba(220,20,60,0.4)", letterSpacing: "4px" }}>
                            {activeSection.toUpperCase()} // PROTOCOL
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
                                        {draftShowOnlineStatus ? '◉' : '○'}
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
                                            // Live preview: update SoundManager immediately
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
                                        {draftSoundSettings.effectsEnabled ? '◉' : '○'}
                                    </button>
                                </div>
                                <div className="v-toggle" onClick={() => {
                                    const v = !draftSoundSettings.ambientStorm;
                                    setDraftSoundSettings({ ...draftSoundSettings, ambientStorm: v });
                                    try { useSettingsStore.getState().updateSetting('sound.orbitAmbientEnabled', v); } catch (_) { }
                                }} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>BACKGROUND AMBIENCE</div>
                                    <button type="button" style={{ color: draftSoundSettings.ambientStorm ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftSoundSettings.ambientStorm ? '◉' : '○'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "appearance" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                <div>
                                    <div className="v-label">SELECT THEME</div>
                                    <p style={{ fontSize: 11, color: "var(--mist)", marginBottom: 12 }}>Change how Orbit looks and feels.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15, marginTop: 15 }}>
                                        {Object.keys(THEME_LABELS).map(id => {
                                            const isSelected = draftTheme === id;

                                            // Fixed preview colors for each theme
                                            let previewPrimary = "#ef4444"; // default (crimson)
                                            let previewBg = "#0a0a0a";

                                            if (id === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                                            else if (id === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                                            else if (id === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                                            else if (id === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                                            else if (id === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                                            else if (id === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => handleThemeClick(id)}
                                                    onMouseEnter={() => setFocusedTheme(id)}
                                                    onMouseLeave={() => setFocusedTheme(draftTheme)}
                                                    style={{
                                                        padding: '12px', borderRadius: '8px', border: '1px solid',
                                                        borderColor: isSelected ? 'var(--crimson)' : 'rgba(255,255,255,0.1)',
                                                        background: isSelected ? 'rgba(139,0,0,0.15)' : 'rgba(255,255,255,0.03)',
                                                        cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: '100%', height: '40px', borderRadius: '6px',
                                                            background: previewBg, border: '1px solid rgba(255,255,255,0.1)',
                                                            display: 'flex', overflow: 'hidden', padding: 4, gap: 2
                                                        }}
                                                    >
                                                        <div style={{ flex: 1, background: previewPrimary, borderRadius: 2 }} />
                                                        <div style={{ flex: 1, background: previewBg, borderRadius: 2 }} />
                                                    </div>
                                                    <div style={{
                                                        color: isSelected ? 'var(--ivory)' : 'var(--mist)',
                                                        fontSize: 10, fontWeight: 700, letterSpacing: '1px', textAlign: 'center', fontFamily: "'Cinzel', serif"
                                                    }}>
                                                        {THEME_LABELS[id].toUpperCase()}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "notifications" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div className="v-toggle" onClick={() => {
                                    const v = !draftNotifications.desktop;
                                    setDraftNotifications({ ...draftNotifications, desktop: v });
                                    try { useSettingsStore.getState().updateSetting('notifications.desktopEnabled', v); } catch (_) { }
                                }} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>DESKTOP NOTIFICATIONS</div>
                                    <button type="button" style={{ color: draftNotifications.desktop ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftNotifications.desktop ? '◉' : '○'}
                                    </button>
                                </div>
                                <div className="v-toggle" onClick={() => {
                                    const v = !draftNotifications.sound;
                                    setDraftNotifications({ ...draftNotifications, sound: v });
                                    try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) { }
                                }} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>NOTIFICATION SOUNDS</div>
                                    <button type="button" style={{ color: draftNotifications.sound ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftNotifications.sound ? '◉' : '○'}
                                    </button>
                                </div>
                                <div className="v-toggle" onClick={() => setDraftNotifications({ ...draftNotifications, email: !draftNotifications.email })} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>EMAIL NOTIFICATIONS</div>
                                    <button type="button" style={{ color: draftNotifications.email ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftNotifications.email ? '◉' : '○'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "orbit" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div className="v-toggle" onClick={() => setDraftOrbitBehavior({ ...draftOrbitBehavior, showRings: !draftOrbitBehavior.showRings })} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>SHOW ORBITAL RINGS</div>
                                    <button type="button" style={{ color: draftOrbitBehavior.showRings ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftOrbitBehavior.showRings ? '◉' : '○'}
                                    </button>
                                </div>
                                <div className="v-toggle" onClick={() => setDraftOrbitBehavior({ ...draftOrbitBehavior, autoPauseOnHover: !draftOrbitBehavior.autoPauseOnHover })} style={{ cursor: 'pointer' }}>
                                    <div className="v-label" style={{ marginBottom: 0 }}>AUTO-PAUSE ANIMATIONS ON HOVER</div>
                                    <button type="button" style={{ color: draftOrbitBehavior.autoPauseOnHover ? 'var(--crimson)' : 'var(--mist)', background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', pointerEvents: 'none' }}>
                                        {draftOrbitBehavior.autoPauseOnHover ? '◉' : '○'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gothic Theme Confirm Modal via Portal */}
            {pendingLocal && createPortal(
                <div
                    onClick={handleCancel}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 99999,
                        background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(145deg, #0a0a10, #0f0f18)',
                            border: '1px solid var(--crimson)',
                            borderRadius: 16,
                            padding: '48px 40px',
                            maxWidth: 420, width: '100%',
                            boxShadow: '0 0 60px rgba(139,0,0,0.4), 0 0 120px rgba(139,0,0,0.15)',
                            textAlign: 'center', fontFamily: "'Cinzel', serif"
                        }}
                    >
                        <div style={{ fontSize: 40, marginBottom: 20 }}>🩸</div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--crimson)', letterSpacing: '4px', marginBottom: 16, textShadow: '0 0 20px rgba(220,20,60,0.5)' }}>INVOKE ESSENCE?</h2>
                        <p style={{ fontSize: 13, color: 'var(--bone)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic', lineHeight: 1.7, marginBottom: 36 }}>
                            Are you certain you wish to manifest<br />
                            <strong style={{ color: 'var(--ivory)', fontStyle: 'normal' }}>{THEME_LABELS[pendingLocal] || pendingLocal}</strong><br />
                            across your entire realm?
                        </p>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: 8,
                                    background: 'transparent', border: '1px solid rgba(220,20,60,0.3)',
                                    color: 'rgba(220,20,60,0.6)', fontSize: 11, fontWeight: 700,
                                    letterSpacing: '2px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                                    transition: 'all 0.2s'
                                }}
                            >CANCEL</button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: 8,
                                    background: 'linear-gradient(135deg, var(--crimson), var(--blood))',
                                    border: '1px solid var(--crimson)', color: 'var(--ivory)',
                                    fontSize: 11, fontWeight: 900, letterSpacing: '2px',
                                    cursor: 'pointer', fontFamily: "'Cinzel', serif",
                                    boxShadow: '0 0 20px rgba(220,20,60,0.5)', transition: 'all 0.2s'
                                }}
                            >MANIFEST</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   VAMPIRE SPOTIFY
───────────────────────────────────────────── */
export function VampireSpotify() {
    const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack, skipNext, skipPrevious } = useSpotifyStore();
    const [playing, setPlaying] = useState(isPlaying || false);
    useEffect(() => { setPlaying(isPlaying); }, [isPlaying]);

    return (
        <div className="vamp-theme-root">
            <OrbitVampire>
                <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
                    {/* Left embellishment column */}
                    <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, flexShrink: 0 }}>
                        <div className="card" style={{ flex: 1, padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                            <div style={{ fontSize: 40, color: 'var(--crimson)', filter: 'drop-shadow(0 0 10px rgba(220,20,60,0.5))' }}>🦇</div>
                            <h2 className="v-label" style={{ fontSize: 16, textAlign: 'center' }}>SYMPHONY OF NIGHT</h2>
                            <div style={{ fontSize: 12, color: 'var(--mist)', textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic' }}>
                                Bind your soul to the eternal resonance. Let the dark melodies guide your path across the shadows.
                            </div>
                        </div>
                    </div>

                    {/* Main player area */}
                    <div className="card" style={{ flex: 1, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 30 }}>
                            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--crimson)', fontFamily: "'Cinzel',serif", letterSpacing: '6px', textShadow: '0 0 20px rgba(220,20,60,0.4)', margin: 0 }}>
                                NOCTURNAL HARMONY
                            </h2>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="nav-btn" onClick={() => (window.location.href = "/")} style={{ border: '1px solid rgba(139,0,0,0.3)', padding: '8px 16px', borderRadius: '4px' }}>
                                    ◀ RETURN
                                </button>

                            </div>
                        </div>

                        {!spotifyLinked ? (
                            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                                <div style={{ fontSize: 16, color: "var(--bone)", fontFamily: "'IM Fell English', serif", fontStyle: "italic", maxWidth: 460, lineHeight: 1.8 }}>
                                    The ritual requires a conduit. Link your Spotify existence to broadcast hymns across the crimson void.
                                </div>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await spotifyService.initiateLogin();
                                    } catch (error) {
                                      console.error("Failed to connect Spotify:", error);
                                    }
                                  }}
                                  style={{ padding: "16px 36px", borderRadius: 4, background: "linear-gradient(135deg,rgba(139,0,0,0.4),rgba(220,20,60,0.2))", color: "var(--ivory)", border: "1px solid var(--crimson)", fontSize: 14, fontWeight: 900, fontFamily: "'Cinzel',serif", letterSpacing: "3px", cursor: "pointer", boxShadow: "0 0 20px rgba(139,0,0,0.3), inset 0 0 10px rgba(220,20,60,0.2)", transition: "all 0.3s" }} 
                                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 30px rgba(220,20,60,0.5), inset 0 0 20px rgba(220,20,60,0.4)"; }} 
                                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(139,0,0,0.3), inset 0 0 10px rgba(220,20,60,0.2)"; }}
                                >
                                    COMMENCE RITUAL
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ width: 280, height: 280, borderRadius: '50%', border: '2px solid var(--crimson)', padding: 8, background: 'linear-gradient(135deg,var(--void),#200000)', boxShadow: '0 0 40px rgba(220,20,60,0.2)', position: 'relative' }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(220,20,60,0.3)' }}>
                                        {currentTrack ? <img src={currentTrack.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", filter: playing ? "none" : "grayscale(0.6)" }} alt="Album Art" /> : <div style={{ width: '100%', height: '100%', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎵</div>}
                                    </div>
                                    {playing && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid var(--crimson)', animation: 'pulse-glow 2s infinite', pointerEvents: 'none' }} />}
                                </div>

                                <div style={{ textAlign: "center", minHeight: 64 }}>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--ivory)", fontFamily: "'Cinzel',serif", letterSpacing: '2px', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>{currentTrack ? currentTrack.name : "Awaiting the Hymn..."}</div>
                                    <div style={{ fontSize: 16, color: "var(--mist)", marginTop: 8, fontFamily: "'IM Fell English', serif", fontStyle: 'italic' }}>{currentTrack ? currentTrack.artist : "The silent choir"}</div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
                                    <button onClick={skipPrevious} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--crimson)", fontSize: 24, opacity: 0.7, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.7}>⏮</button>
                                    <button onClick={() => playing ? pausePlayback() : playTrack()} style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,var(--blood),var(--crimson))", border: "1px solid var(--ivory)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ivory)", fontSize: 24, boxShadow: "0 0 24px rgba(220,20,60,0.5)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                        {playing ? "⏸" : "▶"}
                                    </button>
                                    <button onClick={skipNext} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--crimson)", fontSize: 24, opacity: 0.7, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.7}>⏭</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </OrbitVampire>
        </div>
    );
}
