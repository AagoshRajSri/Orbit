import { useEffect } from "react";

/**
 * FIX 19: Theme Variable Injector
 * 
 * Synchronizes the current theme's design tokens into native CSS variables 
 * on the document root. This allows for synchronous, zero-lag theme switching
 * that bypasses the React render loop for styling.
 */
export default function ThemeVariableInjector({ t }) {
  useEffect(() => {
    if (!t) return;
    
    const root = document.documentElement;
    
    // Core tokens
    const tokens = {
      "--bg": t["--bg"],
      "--bg2": t["--bg2"],
      "--acc": t["--acc"],
      "--acc2": t["--acc2"],
      "--text": t["--text"],
      "--text2": t["--text2"],
      "--border": t["--border"],
      "--radius": t["--radius"],
      "--glass": t["--glass"],
      "--glass2": t["--glass2"],
      "--shadow": t["--shadow"],
      "--font": t["--font"] || t.font || "inherit",
      "--font-mono": t.fontMono || "monospace",
    };

    // Apply all tokens to :root
    Object.entries(tokens).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });

    // Special case for sentiment bg/text (used in MsgBubble)
    if (t["--sent-bg"]) root.style.setProperty("--sent-bg", t["--sent-bg"]);
    if (t["--recv-bg"]) root.style.setProperty("--recv-bg", t["--recv-bg"]);
    if (t["--sent-text"]) root.style.setProperty("--sent-text", t["--sent-text"]);

  }, [t]);

  return null; // Side-effect only component
}
