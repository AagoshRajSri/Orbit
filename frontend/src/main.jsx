import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import DOMPurify from 'dompurify'
import './index.css'
import './styles/animations.css'
import App from './App.jsx'

// ── Strict Trusted Types Policy Enforcement ────────────────────────────────
if (window.trustedTypes && trustedTypes.createPolicy) {
  try {
    trustedTypes.createPolicy('default', {
      createHTML: (string) => DOMPurify.sanitize(string, { USE_PROFILES: { html: true } }),
      createScript: (string) => string,
      createScriptURL: (string) => string,
    });
  } catch (err) {
    console.warn("TrustedTypes default policy already created or failed to create.", err);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// FIX 21: StrictMode double-invokes effects (2× E2EE init cost). Only use in dev.
const AppTree = import.meta.env.DEV
  ? (
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
  : (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

createRoot(document.getElementById('root')).render(AppTree)
