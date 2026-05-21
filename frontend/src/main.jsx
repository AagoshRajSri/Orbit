import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import DOMPurify from 'dompurify'
import './index.css'
import './styles/animations.css'
import App from './App.jsx'
import { initStoreSubscriptions } from './store/orchestrator.js';

// Intercept and suppress upstream Three.js Clock deprecation warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Clock: This module has been deprecated')) {
    return;
  }
  originalWarn(...args);
};

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

// Initialize cross-store dependencies
initStoreSubscriptions();

createRoot(document.getElementById('root')).render(AppTree)
