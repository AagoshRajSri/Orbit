/**
 * OrbitAuth — Orbit Constellation Auth Page  (v2.0 — God-Tier Refactor)
 *
 * Flow
 *   SIGNUP: (1) Credentials → (2) Pick icons → (3) Draw connections → (4) Sealed
 *   LOGIN:  (1) Email + pick icons → (2) Redraw connections
 *
 * Security
 *   • Only label-based edges transmitted — zero coordinates ever sent
 *   • Behavioral biometrics aggregated locally, never raw samples
 *   • Nonce-protected, replay-resistant server requests
 *   • Client-side rate limiting with progressive lockout UI
 *   • Field regenerates on every login / refresh / failed attempt
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  User,
  Mail,
  ChevronLeft,
  X,
  Lock,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import OrbitAuthCanvas, { ICON_DEFS } from "../components/auth/OrbitAuthCanvas";

// ─── Pure helpers ─────────────────────────────────────────────────────────────
function defFor(id) {
  return ICON_DEFS[id % ICON_DEFS.length];
}

/**
 * Collision-free, deterministic label.
 * Uses the icon's index in ICON_DEFS as its unique identity.
 * Format: "I{defIdx}" → "I0" … "I124"
 * Never uses the name or any hash — zero collision risk.
 */
const iconIdxToLabel = (defIdx) => `I${defIdx}`;

function toEdges(conns) {
  // c.from / c.to are raw defIdx integers stored by the canvas click handler.
  // Map directly to "I{n}" — guaranteed globally unique per icon.
  return conns.map((c) => ({
    from: iconIdxToLabel(c.from),
    to: iconIdxToLabel(c.to),
  }));
}

// ─── Step indicator bar ───────────────────────────────────────────────────────
function StepBar({ total, current, accent }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3.5,
            borderRadius: 2,
            transition: "background .5s ease, box-shadow .5s ease",
            background:
              i < current - 1
                ? `rgba(${accent},.3)`
                : i === current - 1
                  ? `rgb(${accent})`
                  : "rgba(255,255,255,.07)",
            boxShadow:
              i === current - 1 ? `0 0 12px rgba(${accent},.7)` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Entropy bar ──────────────────────────────────────────────────────────────
function EntropyBar({ pct, label, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "rgba(255,255,255,.32)",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          marginBottom: 6,
        }}
      >
        <span>Pattern strength</span>
        <span style={{ color }}>
          {label} · {pct}%
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,.07)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            width: `${pct}%`,
            background: `linear-gradient(90deg, #38bdf8, ${color})`,
            transition: "width .55s cubic-bezier(.4,0,.2,1)",
            boxShadow: pct > 60 ? `0 0 10px ${color}55` : "none",
          }}
        />
      </div>
    </div>
  );
}

// ─── Connection list ──────────────────────────────────────────────────────────
function ConnList({ conns }) {
  if (!conns.length) {
    return (
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: "rgba(255,255,255,.22)",
          padding: "10px 0",
        }}
      >
        Click pairs of icons on the field to draw connections…
      </div>
    );
  }
  return conns.map((c, i) => {
    const a = defFor(c.from),
      b = defFor(c.to);
    return (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0",
          borderBottom:
            i < conns.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: "rgba(255,255,255,.65)",
        }}
      >
        <span
          style={{ color: "rgba(255,255,255,.25)", minWidth: 20, fontSize: 11 }}
        >
          {i + 1}.
        </span>
        <span style={{ fontSize: 16 }}>{a?.e}</span>
        <span>{a?.n}</span>
        <ArrowRight
          size={11}
          style={{ color: "rgba(255,255,255,.22)", flexShrink: 0 }}
        />
        <span style={{ fontSize: 16 }}>{b?.e}</span>
        <span>{b?.n}</span>
      </div>
    );
  });
}

// ─── Onboarding hint ──────────────────────────────────────────────────────────
function OnboardingHint({ onDismiss }) {
  return (
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(135deg, rgba(192,132,252,.1) 0%, rgba(56,189,248,.07) 100%)",
        border: "1px solid rgba(192,132,252,.25)",
        borderRadius: 14,
        padding: "14px 40px 14px 16px",
        marginBottom: 16,
        animation: "hintSlideIn .4s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <button
        onClick={onDismiss}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,.3)",
          padding: 2,
          lineHeight: 1,
        }}
      >
        <X size={13} />
      </button>
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>✦</span>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(192,132,252,.95)",
              marginBottom: 5,
            }}
          >
            How it works
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11.5,
              color: "rgba(255,255,255,.52)",
              lineHeight: 1.7,
            }}
          >
            Select 4–7 icons from the field, then connect them in a sequence.
            Your pattern — not the positions — becomes your key.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Animated button with hover/active states ─────────────────────────────────
function ActionButton({ r, g, b, disabled, onClick, children, isLoading }) {
  const [hov, setHov] = useState(false);
  const [active, setActive] = useState(false);
  const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    width: "100%",
    padding: "15px 22px",
    borderRadius: 14,
    border: `1px solid rgba(${r},${g},${b},${disabled ? ".18" : hov ? ".55" : ".40"})`,
    background: disabled
      ? "rgba(255,255,255,.03)"
      : hov
        ? `rgba(${r},${g},${b},.18)`
        : `rgba(${r},${g},${b},.10)`,
    color: disabled ? "rgba(255,255,255,.2)" : `rgb(${r},${g},${b})`,
    fontFamily: "'Nunito','Inter',sans-serif",
    fontSize: 15,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "all .22s cubic-bezier(.4,0,.2,1)",
    marginBottom: 10,
    letterSpacing: "-.1px",
    boxShadow:
      hov && !disabled
        ? `0 0 22px rgba(${r},${g},${b},.28), 0 4px 12px rgba(0,0,0,.3)`
        : "0 4px 12px rgba(0,0,0,.2)",
    transform:
      active && !disabled
        ? "scale(0.98)"
        : hov && !disabled
          ? "scale(1.012)"
          : "scale(1)",
  };
  return (
    <button
      style={style}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => {
        setHov(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "12px 22px",
        borderRadius: 14,
        border: `1px solid rgba(255,255,255,${hov ? ".14" : ".07"})`,
        background: hov ? "rgba(255,255,255,.05)" : "transparent",
        color: `rgba(255,255,255,${hov ? ".6" : ".38"})`,
        fontFamily: "'Nunito','Inter',sans-serif",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .22s",
        marginBottom: 10,
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const OrbitAuth = ({ initialMode = "signup" }) => {
  const {
    fetchConstellationNonce,
    signupWithConstellation,
    loginWithConstellation,
    isSigningUp,
    isLoggingIn,
  } = useAuthStore();

  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [connections, setConnections] = useState([]);
  const [connectFirst, setConnectFirst] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginSelectedIds, setLoginSelectedIds] = useState(new Set());
  const [loginConnections, setLoginConnections] = useState([]);
  const [loginConnectFirst, setLoginConnectFirst] = useState(null);

  const [verified, setVerified] = useState(null);
  const [savedEdges, setSavedEdges] = useState(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (selectedIds.size > 0) setShowHint(false);
  }, [selectedIds.size]);

  const canvasRef = useRef(null);
  const panelRef = useRef(null);
  const [panelLeft, setPanelLeft] = useState(window.innerWidth * 0.6);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const r = panelRef.current?.getBoundingClientRect();
      if (r) setPanelLeft(r.left);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Rate limiting ────────────────────────────────────────────────────────
  const attemptLog = useRef([]);
  const lockTimer = useRef(null);
  const [locked, setLocked] = useState(false);
  const [attLeft, setAttLeft] = useState(5);

  function recordAttempt() {
    const now = Date.now();
    attemptLog.current.push(now);
    attemptLog.current = attemptLog.current.filter((t) => now - t < 60000);
    const left = 5 - attemptLog.current.length;
    setAttLeft(Math.max(0, left));
    if (attemptLog.current.length >= 5) {
      setLocked(true);
      clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => {
        setLocked(false);
        attemptLog.current = [];
        setAttLeft(5);
      }, 30000);
      return true;
    }
    return false;
  }

  // ── Behavioral biometrics ────────────────────────────────────────────────
  const bRef = useRef({
    startTime: null,
    clickTs: [],
    totalVel: 0,
    samples: 0,
    lastPos: null,
  });
  const buildMetrics = () => {
    const b = bRef.current;
    const drawDurationMs = b.startTime ? Date.now() - b.startTime : 0;
    let timingVarianceMs = 0;
    const ts = b.clickTs;
    if (ts.length > 2) {
      const deltas = ts.slice(1).map((t, i) => t - ts[i]);
      const mean = deltas.reduce((a, v) => a + v, 0) / deltas.length;
      timingVarianceMs = Math.sqrt(
        deltas.reduce((a, v) => a + (v - mean) ** 2, 0) / deltas.length,
      );
    }
    return { drawDurationMs, timingVarianceMs };
  };
  const resetBehavior = () => {
    bRef.current = {
      startTime: null,
      clickTs: [],
      totalVel: 0,
      samples: 0,
      lastPos: null,
    };
  };

  // ── Canvas click handler ─────────────────────────────────────────────────
  const handleIconClick = useCallback(
    (id, x, y) => {
      if (locked) {
        toast.error("Too many attempts — wait a moment");
        return;
      }
      const b = bRef.current;
      if (!b.startTime) b.startTime = Date.now();
      b.clickTs.push(Date.now());

      if (mode === "signup") {
        if (step === 2) {
          if (selectedIds.has(id)) {
            const next = new Set(selectedIds);
            next.delete(id);
            setSelectedIds(next);
            toast(`${defFor(id).e} removed`, { duration: 1000 });
          } else if (selectedIds.size < 7) {
            const next = new Set(selectedIds);
            next.add(id);
            setSelectedIds(next);
            toast.success(`${defFor(id).e} ${defFor(id).n}`, {
              duration: 1000,
            });
          } else {
            toast.error("Max 7 icons");
          }
        } else if (step === 3) {
          if (!selectedIds.has(id)) {
            toast.error("Only connect your selected icons");
            return;
          }
          if (connectFirst === null) {
            setConnectFirst(id);
          } else {
            if (connectFirst === id) {
              setConnectFirst(null);
              return;
            }
            const dup = connections.some(
              (c) =>
                (c.from === connectFirst && c.to === id) ||
                (c.from === id && c.to === connectFirst),
            );
            if (dup) {
              toast.error("Already connected");
              setConnectFirst(null);
              return;
            }
            setConnections((prev) => [...prev, { from: connectFirst, to: id }]);
            toast.success(`${defFor(connectFirst).e}→${defFor(id).e}`, {
              duration: 800,
            });
            setConnectFirst(null);
          }
        }
      }

      if (mode === "login") {
        if (step === 1) {
          if (loginSelectedIds.has(id)) {
            const next = new Set(loginSelectedIds);
            next.delete(id);
            setLoginSelectedIds(next);
          } else if (loginSelectedIds.size < 7) {
            const next = new Set(loginSelectedIds);
            next.add(id);
            setLoginSelectedIds(next);
            toast.success(`${defFor(id).e} found`, { duration: 800 });
          } else {
            toast.error("Maximum reached");
          }
        } else if (step === 2) {
          if (!loginSelectedIds.has(id)) return;
          if (loginConnectFirst === null) {
            setLoginConnectFirst(id);
          } else {
            if (loginConnectFirst === id) {
              setLoginConnectFirst(null);
              return;
            }
            const dup = loginConnections.some(
              (c) =>
                (c.from === loginConnectFirst && c.to === id) ||
                (c.from === id && c.to === loginConnectFirst),
            );
            if (!dup) {
              setLoginConnections((prev) => [
                ...prev,
                { from: loginConnectFirst, to: id },
              ]);
              toast.success(`${defFor(loginConnectFirst).e}→${defFor(id).e}`, {
                duration: 800,
              });
            }
            setLoginConnectFirst(null);
          }
        }
      }
    },
    [
      mode,
      step,
      selectedIds,
      connections,
      connectFirst,
      loginSelectedIds,
      loginConnections,
      loginConnectFirst,
      locked,
    ],
  );

  // ── Signup submit ─────────────────────────────────────────────────────────
  const sealAndSubmit = useCallback(async () => {
    if (isSigningUp) return;
    const edges = toEdges(connections);
    setSavedEdges(edges);
    const nonce = await fetchConstellationNonce();
    if (!nonce) return;
    const ok = await signupWithConstellation({
      username: username.trim(),
      email: email.trim(),
      edges,
      nonce,
    });
    if (ok) setStep(4);
  }, [
    connections,
    username,
    email,
    fetchConstellationNonce,
    signupWithConstellation,
    isSigningUp,
  ]);

  // ── Login verify ──────────────────────────────────────────────────────────
  const verifyAndLogin = useCallback(async () => {
    if (isLoggingIn) return;
    const metrics = buildMetrics();
    if (metrics.drawDurationMs < 800) {
      toast.error("Too fast — please interact naturally");
      return;
    }
    if (recordAttempt()) {
      canvasRef.current?.flashError();
      // Regenerate field on failed attempt (anti-replay)
      canvasRef.current?.regenerateField?.();
      return;
    }
    const edges = toEdges(loginConnections);
    const nonce = await fetchConstellationNonce();
    if (!nonce) return;
    const authTime = (metrics.drawDurationMs / 1000).toFixed(1);
    const ok = await loginWithConstellation({
      email: loginEmail.trim(),
      edges,
      nonce,
      behavioral: metrics,
    });
    if (ok) {
      setVerified(authTime);
    } else {
      canvasRef.current?.flashError();
      // Regenerate field on failed login (anti-replay security)
      setTimeout(() => canvasRef.current?.regenerateField?.(), 420);
      setLoginSelectedIds(new Set());
      setLoginConnections([]);
      setLoginConnectFirst(null);
      setStep(1);
      resetBehavior();
    }
  }, [
    loginConnections,
    loginEmail,
    fetchConstellationNonce,
    loginWithConstellation,
    isLoggingIn,
  ]);

  // ── Mode switch ───────────────────────────────────────────────────────────
  const switchToLogin = () => {
    setMode("login");
    setStep(1);
    setLoginEmail("");
    setLoginSelectedIds(new Set());
    setLoginConnections([]);
    setLoginConnectFirst(null);
    resetBehavior();
    canvasRef.current?.regenerateField?.(); // regenerate on every login
  };
  const switchToSignup = () => {
    setMode("signup");
    setStep(1);
    setUsername("");
    setEmail("");
    setSelectedIds(new Set());
    setConnections([]);
    setConnectFirst(null);
    setShowHint(true);
    canvasRef.current?.shufflePositions?.();
  };

  // ── Entropy ───────────────────────────────────────────────────────────────
  const selN = selectedIds.size;
  const selPct = Math.min(100, Math.round((selN / 7) * 100));
  const connPct = Math.min(
    100,
    Math.round((connections.length / Math.max(selN - 1, 1)) * 100),
  );
  const totalPct = Math.round((selPct + connPct) / 2);
  const eLabel = totalPct < 40 ? "Weak" : totalPct < 75 ? "Medium" : "Strong";
  const eColor =
    totalPct < 40 ? "#f87171" : totalPct < 75 ? "#fbbf24" : "#4ade80";

  const isBusy = isSigningUp || isLoggingIn;

  const activeSel = mode === "signup" ? selectedIds : loginSelectedIds;
  const activeConns = mode === "signup" ? connections : loginConnections;
  const activeCF = mode === "signup" ? connectFirst : loginConnectFirst;

  // ── Input style ───────────────────────────────────────────────────────────
  const inp = (disabled = false) => ({
    width: "100%",
    boxSizing: "border-box",
    background: disabled ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 14,
    padding: "14px 16px 14px 44px",
    color: "#f0ebff",
    fontSize: 15.5,
    outline: "none",
    fontFamily: "'Nunito','Inter',sans-serif",
    transition: "border-color .22s, box-shadow .22s",
    opacity: disabled ? 0.5 : 1,
  });
  const inpWrap = { position: "relative", marginBottom: 12 };
  const inpIco = {
    position: "absolute",
    left: 15,
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255,255,255,.32)",
    pointerEvents: "none",
  };

  const connBox = {
    background: "rgba(0,0,0,.25)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    padding: "12px 16px",
    minHeight: 88,
    maxHeight: 170,
    overflowY: "auto",
    marginBottom: 14,
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (verified) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(80,40,160,.32) 0%, #0d0b14 65%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
        }}
      >
        <div style={{ position: "relative" }}>
          <ShieldCheck size={108} style={{ color: "#4ade80", opacity: 0.9 }} />
          <div
            style={{
              position: "absolute",
              inset: -28,
              background: "rgba(74,222,128,.14)",
              borderRadius: "50%",
              filter: "blur(32px)",
              animation: "pulse 2.5s ease-in-out infinite",
            }}
          />
        </div>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: "-.6px",
            textAlign: "center",
            color: "#f0ebff",
          }}
        >
          Identity Confirmed
        </h1>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: "rgba(255,255,255,.45)",
            letterSpacing: ".04em",
          }}
        >
          Pattern verified in {verified}s · Welcome back
        </p>
        <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      </div>
    );
  }

  const isLockStatus = locked
    ? `locked · ${attLeft > 0 ? attLeft : 30}s`
    : attLeft < 5
      ? `${attLeft} tries left`
      : "secure";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0d0b14",
        overflow: "hidden",
        fontFamily: "'Nunito','Inter',sans-serif",
        color: "#f0ebff",
      }}
    >
      {/* ── Canvas ── */}
      <OrbitAuthCanvas
        ref={canvasRef}
        mode={mode}
        selectedIds={activeSel}
        connections={activeConns}
        connectFirst={activeCF}
        panelRight={panelLeft}
        onIconClick={handleIconClick}
      />

      {/* ── TOP BAR — Security Badge ── */}
      <div
        style={{
          position: "fixed",
          top: 18,
          left: 18,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: locked ? "rgba(248,71,71,.12)" : "rgba(13,11,20,.92)",
          border: `1px solid ${locked ? "rgba(248,113,113,.35)" : "rgba(74,222,128,.22)"}`,
          borderRadius: 24,
          padding: "7px 16px 7px 12px",
          backdropFilter: "blur(22px)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12.5,
          letterSpacing: ".07em",
          color: locked ? "#f87171" : "#4ade80",
          pointerEvents: "none",
          boxShadow: locked
            ? "0 0 18px rgba(248,113,113,.22)"
            : "0 0 18px rgba(74,222,128,.15)",
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: locked ? "#f87171" : "#4ade80",
            flexShrink: 0,
            animation: locked ? "none" : "pulseOk 2.5s ease-in-out infinite",
            boxShadow: locked ? "none" : "0 0 8px #4ade80",
          }}
        />
        <Lock size={12} style={{ opacity: 0.8 }} />
        {isLockStatus.toUpperCase()}
      </div>

      {/* ── TOP BAR — Standard Auth link ── */}
      <Link
        to="/login"
        style={{
          position: "fixed",
          top: 18,
          left: 148,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.10)",
          borderRadius: 24,
          backdropFilter: "blur(18px)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.52)",
          textDecoration: "none",
          transition: "all .22s",
          pointerEvents: "all",
        }}
      >
        <ChevronLeft size={13} />
        Standard Auth
      </Link>

      {/* ── Side Panel ── */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 100vw)" /* 10% wider than 400px */,
          display: "flex",
          flexDirection: "column",
          background: "rgba(14,11,32,.94)",
          backdropFilter: "blur(56px) saturate(1.5)",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          boxShadow:
            "-32px 0 100px rgba(0,0,0,.8), inset 1px 0 0 rgba(255,255,255,.04)",
          zIndex: 10,
          overflowY: "auto",
        }}
      >
        {/* ─ Header ─ */}
        <div
          style={{
            padding: "26px 34px 18px",
            borderBottom: "1px solid rgba(255,255,255,.07)",
          }}
        >
          {/* BRANDING ROW — icon + title + subtitle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 34,
                lineHeight: 1,
                flexShrink: 0,
                filter:
                  "drop-shadow(0 0 14px rgba(192,132,252,.8)) drop-shadow(0 0 28px rgba(192,132,252,.4))",
              }}
            >
              🔮
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "-.4px",
                  whiteSpace: "nowrap",
                  background:
                    "linear-gradient(135deg, #e8d5ff 0%, #c084fc 45%, #7dd3fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.2,
                  filter: "drop-shadow(0 0 18px rgba(192,132,252,.35))",
                }}
              >
                Orbit Constellation Auth
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10.5,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.3)",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Zap size={10} style={{ color: "#c084fc", opacity: 0.75 }} />
                Picture Password · Argon2id
              </div>
            </div>
          </div>

          {/* MODE TOGGLE — full-width strip below branding */}
          <div
            style={{
              display: "flex",
              background: "rgba(0,0,0,.38)",
              border: "1px solid rgba(255,255,255,.09)",
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {[
              ["signup", "✦  Sign Up"],
              ["login", "⟡  Log In"],
            ].map(([m, label]) => (
              <button
                key={m}
                onClick={m === "signup" ? switchToSignup : switchToLogin}
                style={{
                  flex: 1,
                  fontFamily: "'Nunito','Inter',sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  background:
                    mode === m
                      ? "linear-gradient(135deg, rgba(192,132,252,.22), rgba(125,211,252,.12))"
                      : "transparent",
                  color: mode === m ? "#e0c4ff" : "rgba(255,255,255,.35)",
                  border:
                    mode === m
                      ? "1px solid rgba(192,132,252,.32)"
                      : "1px solid transparent",
                  padding: "10px 0",
                  borderRadius: 9,
                  cursor: "pointer",
                  transition: "all .25s",
                  boxShadow:
                    mode === m ? "0 0 14px rgba(192,132,252,.2)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* SECONDARY AUTH OPTIONS — Face Lock & Ambient Presence */}
          <div
            style={{
              display: "flex",
              gap: 3,
              marginTop: 12,
              background: "rgba(0,0,0,.2)",
              border: "1px solid rgba(255,255,255,.05)",
              borderRadius: 10,
              padding: 3,
            }}
          >
            <a
              href={mode === "signup" ? "/signup/facelock" : "/login/facelock"}
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "'Nunito','Inter',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".02em",
                background: "transparent",
                color: "rgba(255,255,255,.4)",
                border: "1px solid transparent",
                padding: "8px 0",
                borderRadius: 8,
                textDecoration: "none",
                transition: "all .2s",
                cursor: "pointer",
              }}
            >
              👁️ Face Lock
            </a>
            <a
              href={mode === "signup" ? "/signup/ambient" : "/login/ambient"}
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "'Nunito','Inter',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".02em",
                background: "transparent",
                color: "rgba(255,255,255,.4)",
                border: "1px solid transparent",
                padding: "8px 0",
                borderRadius: 8,
                textDecoration: "none",
                transition: "all .2s",
                cursor: "pointer",
              }}
            >
              📱 Ambient
            </a>
          </div>
        </div>

        {/* ─ Body ─ */}
        <div style={{ padding: "28px 34px 26px", flex: 1 }}>
          {/* ══ SIGNUP ══════════════════════════════════════════════════════ */}
          {mode === "signup" && (
            <>
              <StepBar total={4} current={step} accent="192,132,252" />

              {/* STEP 1 — Credentials */}
              {step === 1 && (
                <div>
                  <h1
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      letterSpacing: "-.5px",
                      margin: "0 0 8px",
                    }}
                  >
                    Create identity
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.44)",
                      lineHeight: 1.75,
                      margin: "0 0 22px",
                    }}
                  >
                    Your constellation pattern becomes your key — no password to
                    memorise.
                  </p>
                  <div style={inpWrap}>
                    <User size={16} style={inpIco} />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={inp()}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(192,132,252,.5)";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(192,132,252,.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,.12)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div style={inpWrap}>
                    <Mail size={16} style={inpIco} />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inp()}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(192,132,252,.5)";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(192,132,252,.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,.12)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div style={{ height: 14 }} />
                  <ActionButton
                    r={192}
                    g={132}
                    b={252}
                    disabled={
                      !username.trim() || !email.trim() || !email.includes("@")
                    }
                    onClick={() => setStep(2)}
                  >
                    Next: Pick Your Icons <ArrowRight size={16} />
                  </ActionButton>
                </div>
              )}

              {/* STEP 2 — Pick icons */}
              {step === 2 && (
                <div>
                  <h1
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      letterSpacing: "-.5px",
                      margin: "0 0 8px",
                    }}
                  >
                    Pick your icons
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.44)",
                      lineHeight: 1.75,
                      margin: "0 0 18px",
                    }}
                  >
                    Select 4–7 icons. Remember{" "}
                    <strong style={{ color: "rgba(255,255,255,.72)" }}>
                      which ones
                    </strong>{" "}
                    — positions shuffle every session.
                  </p>

                  {showHint && selectedIds.size === 0 && (
                    <OnboardingHint onDismiss={() => setShowHint(false)} />
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 10,
                      margin: "0 0 16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: "#c084fc",
                        lineHeight: 1,
                        letterSpacing: "-3px",
                        textShadow: "0 0 24px rgba(192,132,252,.5)",
                      }}
                    >
                      {selN}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: "rgba(255,255,255,.3)",
                        textTransform: "uppercase",
                        paddingBottom: 9,
                      }}
                    >
                      of 7 max
                    </span>
                  </div>
                  <EntropyBar pct={selPct} label={eLabel} color={eColor} />
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,.07)",
                      margin: "18px 0",
                    }}
                  />
                  <ActionButton
                    r={192}
                    g={132}
                    b={252}
                    disabled={selN < 4}
                    onClick={() => {
                      setStep(3);
                      setConnectFirst(null);
                    }}
                  >
                    Next: Draw Connections <ArrowRight size={16} />
                  </ActionButton>
                  <GhostButton onClick={() => setStep(1)}>← Back</GhostButton>
                </div>
              )}

              {/* STEP 3 — Draw connections */}
              {step === 3 && (
                <div>
                  <h1
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      letterSpacing: "-.5px",
                      margin: "0 0 8px",
                    }}
                  >
                    Draw connections
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.44)",
                      lineHeight: 1.75,
                      margin: "0 0 16px",
                    }}
                  >
                    Click pairs of your icons to link them in order. The
                    sequence{" "}
                    <strong style={{ color: "rgba(255,255,255,.72)" }}>
                      is your password.
                    </strong>
                  </p>
                  <div style={connBox}>
                    <ConnList conns={connections} />
                  </div>
                  <EntropyBar pct={totalPct} label={eLabel} color={eColor} />
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,.07)",
                      margin: "16px 0",
                    }}
                  />
                  <ActionButton
                    r={74}
                    g={222}
                    b={128}
                    disabled={
                      connections.length < Math.max(2, selN - 2) || isBusy
                    }
                    onClick={sealAndSubmit}
                  >
                    {isSigningUp ? "Sealing…" : "Seal Identity ✦"}
                  </ActionButton>
                  <GhostButton
                    onClick={() => {
                      setConnections([]);
                      setConnectFirst(null);
                      setStep(2);
                    }}
                  >
                    <RotateCcw size={14} /> Reset
                  </GhostButton>
                </div>
              )}

              {/* STEP 4 — Sealed */}
              {step === 4 && (
                <div>
                  <h1
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      letterSpacing: "-.5px",
                      margin: "0 0 8px",
                      color: "#4ade80",
                      textShadow: "0 0 24px rgba(74,222,128,.45)",
                    }}
                  >
                    Sealed ✦
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.44)",
                      lineHeight: 1.75,
                      margin: "0 0 18px",
                    }}
                  >
                    Constellation registered. Positions are never stored — only
                    a cryptographic fingerprint lives on the server.
                  </p>
                  <div
                    style={{
                      background: "rgba(74,222,128,.05)",
                      border: "1px solid rgba(74,222,128,.22)",
                      borderRadius: 14,
                      padding: "16px 18px",
                      marginBottom: 22,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "rgba(74,222,128,.55)",
                        marginBottom: 10,
                      }}
                    >
                      Your pattern
                    </div>
                    {savedEdges?.map((e, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12.5,
                          color: "rgba(255,255,255,.58)",
                          fontFamily: "'DM Mono', monospace",
                          lineHeight: 2,
                        }}
                      >
                        {i + 1}. {e.from}{" "}
                        <ArrowRight
                          size={10}
                          style={{
                            display: "inline",
                            color: "rgba(255,255,255,.22)",
                          }}
                        />{" "}
                        {e.to}
                      </div>
                    ))}
                  </div>
                  <ActionButton
                    r={192}
                    g={132}
                    b={252}
                    disabled={false}
                    onClick={switchToLogin}
                  >
                    Try Logging In <ArrowRight size={16} />
                  </ActionButton>
                </div>
              )}
            </>
          )}

          {/* ══ LOGIN ════════════════════════════════════════════════════════ */}
          {mode === "login" && (
            <>
              <StepBar total={2} current={step} accent="34,211,238" />

              {/* Email — always visible */}
              <div style={inpWrap}>
                <Mail size={16} style={inpIco} />
                <input
                  type="email"
                  placeholder="Your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={step === 2}
                  style={inp(step === 2)}
                  onFocus={(e) => {
                    if (step !== 2) {
                      e.target.style.borderColor = "rgba(34,211,238,.5)";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(34,211,238,.1)";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* STEP 1 — Find icons */}
              {step === 1 && (
                <div>
                  <h1
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      letterSpacing: "-.5px",
                      margin: "0 0 8px",
                    }}
                  >
                    Find your icons
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.44)",
                      lineHeight: 1.75,
                      margin: "0 0 18px",
                    }}
                  >
                    Positions have shuffled. Spot your icons by their{" "}
                    <strong style={{ color: "rgba(255,255,255,.72)" }}>
                      emoji and name label
                    </strong>
                    .
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 10,
                      margin: "0 0 16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: "#22d3ee",
                        lineHeight: 1,
                        letterSpacing: "-3px",
                        textShadow: "0 0 24px rgba(34,211,238,.5)",
                      }}
                    >
                      {loginSelectedIds.size}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: "rgba(255,255,255,.3)",
                        textTransform: "uppercase",
                        paddingBottom: 9,
                      }}
                    >
                      found
                    </span>
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,.07)",
                      margin: "0 0 18px",
                    }}
                  />
                  <ActionButton
                    r={34}
                    g={211}
                    b={238}
                    disabled={
                      !loginEmail.trim() ||
                      !loginEmail.includes("@") ||
                      loginSelectedIds.size < 4
                    }
                    onClick={() => {
                      setStep(2);
                      setLoginConnectFirst(null);
                    }}
                  >
                    Next: Reconnect <ArrowRight size={16} />
                  </ActionButton>
                  <GhostButton onClick={switchToSignup}>
                    No account? Sign up instead
                  </GhostButton>
                </div>
              )}

              {/* STEP 2 — Redraw */}
              {step === 2 && (
                <div>
                  <h1
                    style={{
                      fontSize: 27,
                      fontWeight: 900,
                      letterSpacing: "-.5px",
                      margin: "0 0 8px",
                    }}
                  >
                    Redraw sequence
                  </h1>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,.44)",
                      lineHeight: 1.75,
                      margin: "0 0 16px",
                    }}
                  >
                    Link your icons in the{" "}
                    <strong style={{ color: "rgba(255,255,255,.72)" }}>
                      same order
                    </strong>{" "}
                    as when you signed up.
                  </p>
                  <div style={connBox}>
                    <ConnList conns={loginConnections} />
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,.07)",
                      margin: "0 0 16px",
                    }}
                  />
                  <ActionButton
                    r={74}
                    g={222}
                    b={128}
                    disabled={loginConnections.length < 2 || isBusy}
                    onClick={verifyAndLogin}
                  >
                    {isLoggingIn ? "Verifying…" : "Unlock ✦"}
                  </ActionButton>
                  <GhostButton
                    onClick={() => {
                      setLoginConnections([]);
                      setLoginSelectedIds(new Set());
                      setLoginConnectFirst(null);
                      setStep(1);
                      resetBehavior();
                      canvasRef.current?.regenerateField?.();
                    }}
                  >
                    <RotateCcw size={14} /> Retry from scratch
                  </GhostButton>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─ Footer ─ */}
        <div
          style={{
            padding: "12px 34px 20px",
            borderTop: "1px solid rgba(255,255,255,.05)",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10.5,
              color: "rgba(255,255,255,.18)",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              textAlign: "center",
              margin: 0,
            }}
          >
            Orbit Constellation ·{" "}
            {mode === "signup" ? `Step ${step}/4` : `Step ${step}/2`} ·
            End-to-End
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulseOk { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes hintSlideIn { from{opacity:0;transform:translateY(-7px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default OrbitAuth;
