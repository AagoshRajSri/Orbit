import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CyberAuthStyles } from "../components/auth/CyberAuth";

const COOLDOWN = 60;

const VerifyEmailPage = () => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const { verifyEmail, resendVerification, authUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || authUser?.email;

  // Auto-focus first input
  useEffect(() => {
    if (!email && !authUser) return;
    setTimeout(() => refs[0].current?.focus(), 100);
  }, [email, authUser]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = useCallback(async (code) => {
    setErrorMsg("");
    setSubmitting(true);
    const ok = await verifyEmail(email, code);
    setSubmitting(false);
    if (ok) {
      navigate("/");
    } else {
      setErrorMsg("INVALID_CODE: AUTHENTICATION_FAILED");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }, [email, verifyEmail, navigate]);

  if (!email && !authUser) return <Navigate to="/login" />;
  if (authUser?.isEmailVerified) return <Navigate to="/" />;

  const handleChange = (i, val) => {
    if (val.length > 1) {
      const clean = val.replace(/\D/g, "").slice(0, 6);
      if (clean.length === 6) {
        const arr = clean.split("");
        setDigits(arr);
        refs[5].current?.focus();
        submit(clean);
        return;
      }
      val = val.replace(/\D/g, "")[0] || "";
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setErrorMsg("");
    if (val && i < 5) refs[i + 1].current?.focus();
    if (val && next.every(d => d !== "")) {
      submit(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    await resendVerification(email);
    setResending(false);
    setCooldown(COOLDOWN);
    setDigits(["", "", "", "", "", ""]);
    setErrorMsg("");
    setTimeout(() => refs[0].current?.focus(), 50);
  };

  const code = digits.join("");
  const ready = code.length === 6;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="flex flex-col gap-2 relative z-10 w-full"
    >
      <CyberAuthStyles />

      {/* ── Header ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center flex flex-col items-center gap-2 mb-1">
        {/* Spinning orbit icon */}
        <div className="relative flex items-center justify-center" style={{ width: "48px", height: "48px" }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(139,92,246,0.4)", animation: "spin-glow 8s linear infinite" }}
          />
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))",
            border: "1px solid rgba(139,92,246,0.5)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l7 4v6c0 5-7 10-7 10S5 17 5 12V6l7-4z" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "22px",
          fontWeight: "800",
          color: "white",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          VERIFY IDENTITY
        </h1>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.25)",
        }}>
          EMAIL_VERIFICATION_SEQUENCE
        </p>
      </motion.div>

      {/* ── Sub-text ───────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center mb-4">
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.05em",
          color: "rgba(255,255,255,0.35)",
          lineHeight: 1.6,
        }}>
          A security code has been dispatched to:
          <br />
          <span style={{ color: "rgba(167,139,250,0.85)", fontWeight: "600" }}>{email}</span>
        </p>
      </motion.div>

      {/* ── OTP Inputs ─────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3">
        <label style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.2)",
          textTransform: "uppercase"
        }}>
          Enter_6_Digit_Sigil
        </label>

        <div className="flex gap-2 sm:gap-3 justify-between">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={() => setFocused(i)}
              onBlur={() => setFocused(null)}
              style={{
                width: "48px",
                height: "56px",
                background: focused === i
                  ? "rgba(139,92,246,0.1)"
                  : d
                  ? "rgba(99,102,241,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: focused === i
                  ? "1px solid rgba(167,139,250,0.6)"
                  : d
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                textAlign: "center",
                fontSize: "20px",
                fontWeight: "700",
                color: d ? "#a78bfa" : "white",
                outline: "none",
                caretColor: "transparent",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: focused === i ? "0 0 15px rgba(139,92,246,0.15)" : "none",
              }}
            />
          ))}
        </div>

        {/* Error message */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.05em",
          color: "#f87171",
          minHeight: "14px",
          marginTop: "2px",
        }}>
          {errorMsg}
        </div>
      </motion.div>

      {/* ── Submit button ──────────────────────── */}
      <motion.div variants={itemVariants}>
        <button
          className="cyber-submit-btn"
          onClick={() => ready && !submitting && submit(code)}
          disabled={!ready || submitting}
          style={{ width: "100%" }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-3">
              <div className="beating-loader" />
              VALIDATING...
            </span>
          ) : (
            <span>UNSEAL_ACCOUNT //</span>
          )}
        </button>
      </motion.div>

      {/* ── Divider ────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 py-1">
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
      </motion.div>

      {/* ── Resend ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <button
          onClick={handleResend}
        disabled={cooldown > 0 || resending}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid rgba(139,92,246,0.12)",
          background: "rgba(139,92,246,0.03)",
          cursor: cooldown > 0 || resending ? "not-allowed" : "pointer",
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: cooldown > 0 || resending ? "rgba(255,255,255,0.15)" : "rgba(167,139,250,0.6)",
          transition: "all 0.25s",
          opacity: cooldown > 0 || resending ? 0.6 : 1,
        }}
        onMouseEnter={e => {
          if (cooldown === 0 && !resending) {
            e.currentTarget.style.background = "rgba(139,92,246,0.08)";
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(139,92,246,0.03)";
          e.currentTarget.style.borderColor = "rgba(139,92,246,0.12)";
        }}
      >
        {resending
          ? "DISPATCHING..."
          : cooldown > 0
          ? `RESEND_AVAILABLE_IN_${cooldown}s`
          : "RESEND_SIGIL_CODE →"
        }
        </button>
      </motion.div>

      {/* ── Return to Login ───────────────────────── */}
      <motion.div variants={itemVariants} className="text-center mt-2">
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.25)",
            background: "none",
            border: "none",
            padding: "4px 8px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(167,139,250,0.8)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
        >
          ← BACK_TO_LOGIN / LOGOUT
        </button>
      </motion.div>

      {/* ── Footer ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center pt-2">
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "8px",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.1)",
        }}>
          ◈ SECURE_NODE_COMMUNICATION_ESTABLISHED ◈
        </p>
      </motion.div>
    </motion.div>
  );
};

export default VerifyEmailPage;
