/**
 * ORBIT DESIGN TOKENS
 * Injected once at :root via <OrbitTokens /> — use var(--token) everywhere.
 * Sourced from darkTheme.jsx (vampire), pastelTheme.jsx (dreamland),
 * and the ResponsiveLayouts.jsx spec.
 *
 * Usage:
 *   import { OrbitTokens } from "./OrbitTokens";
 *   // Mount once near app root (after auth, before pages).
 *   <OrbitTokens theme="dark" />
 */

// ── Token maps per theme ────────────────────────────────────────────────────
const TOKENS = {
  // Vampire / Dark (primary production theme)
  dark: `
    --bg:           #050508;
    --bg2:          #0A0A10;
    --surface:      #0F0F18;
    --surface2:     #141420;
    --border:       rgba(139,0,0,0.25);
    --border-soft:  rgba(139,0,0,0.12);
    --acc:          #DC143C;
    --acc2:         #8B0000;
    --acc-glow:     rgba(220,20,60,0.35);
    --text:         #F0E6D3;
    --text2:        #A89BB0;
    --text3:        #7B6E8A;
    --font:         'Cinzel', serif;
    --font-body:    'IM Fell English', serif;
    --radius:       12px;
    --radius-lg:    20px;
    --shadow:       0 8px 32px rgba(0,0,0,0.6);
    --shadow-acc:   0 0 24px rgba(220,20,60,0.3);
    --bubble-in:    rgba(20,20,32,0.95);
    --bubble-out:   linear-gradient(135deg,#8B0000,#5A0000);
    --bubble-in-brd:rgba(139,0,0,0.25);
    --bubble-out-brd:rgba(220,20,60,0.5);
    --input-bg:     rgba(10,10,16,0.7);
    --navbar-h:     60px;
    --sidebar-w:    280px;
    --sidebar-w-sm: 0px;
    --chat-bg:      #0A0A10;
    --msg-area-bg:  #050508;
    --pinbar-bg:    rgba(139,0,0,0.06);
    --topbar-bg:    rgba(5,5,8,0.95);
    --music-bg:     #121212;
    --music-sidebar:#000000;
    --music-bar:    #181818;
  `,
  // Pastel Dream / Dreamland
  pastel: `
    --bg:           #fff0f5;
    --bg2:          #fdf0f5;
    --surface:      rgba(255,255,255,0.9);
    --surface2:     rgba(255,240,248,0.9);
    --border:       rgba(255,182,210,0.35);
    --border-soft:  rgba(255,182,210,0.15);
    --acc:          #f4a0c0;
    --acc2:         #8b3fc8;
    --acc-glow:     rgba(244,160,192,0.4);
    --text:         #3d1a2e;
    --text2:        #7a4a6a;
    --text3:        #a0789a;
    --font:         'Inter', sans-serif;
    --font-body:    'Inter', sans-serif;
    --radius:       14px;
    --radius-lg:    22px;
    --shadow:       0 4px 24px rgba(244,160,192,0.15);
    --shadow-acc:   0 0 20px rgba(244,160,192,0.3);
    --bubble-in:    rgba(255,255,255,0.95);
    --bubble-out:   #f4a0c0;
    --bubble-in-brd:rgba(255,182,210,0.3);
    --bubble-out-brd:transparent;
    --input-bg:     white;
    --navbar-h:     60px;
    --sidebar-w:    280px;
    --sidebar-w-sm: 0px;
    --chat-bg:      #fff0f5;
    --msg-area-bg:  #fff0f5;
    --pinbar-bg:    rgba(255,220,235,0.5);
    --topbar-bg:    rgba(255,255,255,0.9);
    --music-bg:     #121212;
    --music-sidebar:#000000;
    --music-bar:    #181818;
  `,
};

/** Inject tokens into :root for the given theme. */
export function OrbitTokens({ theme = "dark" }) {
  const tokens = TOKENS[theme] || TOKENS.dark;
  return (
    <style>{`:root { ${tokens} }`}</style>
  );
}

/** CSS reset + global layout primitives injected once at app root. */
export function OrbitGlobalReset() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { font-size: 16px; -webkit-text-size-adjust: 100%; }
      body { min-height: 100dvh; overflow-x: hidden; background: var(--bg); color: var(--text); font-family: var(--font-body, sans-serif); }
      img, svg { display: block; max-width: 100%; }
      input, textarea, button { font: inherit; }
      button { cursor: pointer; border: none; background: none; }

      /* Scrollbar */
      * { scrollbar-width: thin; scrollbar-color: var(--acc2) var(--bg); }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: var(--bg); }
      ::-webkit-scrollbar-thumb { background: var(--acc2); border-radius: 4px; }

      /* Shared micro-animations */
      @keyframes orbit-fade-up {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:translateY(0);     }
      }
      @keyframes orbit-pulse-glow {
        0%,100% { box-shadow: var(--shadow-acc); }
        50%      { box-shadow: 0 0 40px var(--acc), var(--shadow-acc); }
      }
      @keyframes orbit-spin {
        to { transform: rotate(360deg); }
      }
      .orbit-fade-up   { animation: orbit-fade-up .28s ease both; }
      .orbit-spin      { animation: orbit-spin 1s linear infinite; }
    `}</style>
  );
}
