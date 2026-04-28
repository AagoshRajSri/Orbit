import { useState, useRef, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLocation, useNavigate, Navigate } from "react-router-dom";

/* ─── Inline styles so the page works without any external CSS ───────────── */
const S = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#06040f",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Space Mono', 'Courier New', monospace",
  },
  orb1: {
    position: "absolute", top: "-15%", left: "-10%",
    width: "50%", height: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute", bottom: "-15%", right: "-10%",
    width: "50%", height: "50%",
    background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "440px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "40px 36px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
    backdropFilter: "blur(20px)",
  },
  icon: {
    width: "52px", height: "52px",
    borderRadius: "16px",
    background: "rgba(139,92,246,0.1)",
    border: "1px solid rgba(139,92,246,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#f0ebff",
    margin: "0 0 6px",
    letterSpacing: "-0.3px",
    fontFamily: "'Syne', sans-serif",
  },
  sub: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.6,
    margin: "0 0 32px",
    letterSpacing: "0.02em",
  },
  email: { color: "rgba(167,139,250,0.8)" },
  label: {
    fontSize: "9px",
    letterSpacing: "0.2em",
    color: "rgba(255,255,255,0.25)",
    marginBottom: "12px",
    display: "block",
  },
  inputs: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  },
  digitBase: {
    flex: 1,
    height: "56px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    caretColor: "transparent",
    fontFamily: "inherit",
    WebkitAppearance: "none",
  },
  digitFocus: {
    borderColor: "rgba(139,92,246,0.7)",
    background: "rgba(139,92,246,0.08)",
  },
  digitFilled: {
    borderColor: "rgba(139,92,246,0.4)",
    background: "rgba(139,92,246,0.06)",
  },
  error: {
    fontSize: "10px",
    color: "#f87171",
    letterSpacing: "0.05em",
    marginBottom: "20px",
    minHeight: "14px",
  },
  btn: {
    width: "100%",
    height: "52px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    letterSpacing: "0.15em",
    fontWeight: "700",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "opacity 0.2s, transform 0.15s",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "white",
    boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.06)",
    margin: "20px 0",
  },
  resend: {
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "10px",
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.25)",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "color 0.2s",
    padding: "0",
  },
  resendActive: { color: "rgba(167,139,250,0.7)" },
  badge: {
    marginTop: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "9px",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.12)",
  },
};

const COOLDOWN = 60; // seconds before resend is allowed again

const VerifyEmailPage = () => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const { verifyEmail, resendVerification, authUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || authUser?.email;

  if (!email && !authUser) return <Navigate to="/login" />;
  if (authUser?.isEmailVerified) return <Navigate to="/" />;

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => refs[0].current?.focus(), 100);
  }, []);

  // Cooldown timer
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
      setErrorMsg("Incorrect code — double-check and try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }, [email, verifyEmail, navigate]);

  const handleChange = (i, val) => {
    // Allow paste of full 6-digit code into first box
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

    // Auto-submit when all filled
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

  return (
    <div style={S.wrap}>
      <div style={S.orb1} />
      <div style={S.orb2} />

      <div style={S.card}>
        {/* Icon */}
        <div style={S.icon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 style={S.title}>Check your inbox</h1>
        <p style={S.sub}>
          We sent a 6-digit code to{" "}
          <span style={S.email}>{email}</span>
          <br />Enter it below to verify your account.
        </p>

        {/* OTP Inputs */}
        <span style={S.label}>VERIFICATION CODE</span>
        <div style={S.inputs}>
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
                ...S.digitBase,
                ...(focused === i ? S.digitFocus : {}),
                ...(d && focused !== i ? S.digitFilled : {}),
              }}
            />
          ))}
        </div>

        {/* Error message */}
        <div style={S.error}>{errorMsg}</div>

        {/* Submit button */}
        <button
          onClick={() => ready && !submitting && submit(code)}
          disabled={!ready || submitting}
          style={{
            ...S.btn,
            ...S.btnPrimary,
            ...(!ready || submitting ? S.btnDisabled : {}),
          }}
        >
          {submitting ? (
            <>
              <span style={{
                display: "inline-block", width: "14px", height: "14px",
                border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white",
                borderRadius: "50%", animation: "orbit-spin 0.7s linear infinite",
              }} />
              VERIFYING...
            </>
          ) : "VERIFY IDENTITY //"}
        </button>

        <div style={S.divider} />

        {/* Resend */}
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          style={{
            ...S.resend,
            ...(cooldown === 0 && !resending ? S.resendActive : {}),
          }}
        >
          {resending ? (
            "SENDING..."
          ) : cooldown > 0 ? (
            `RESEND IN ${cooldown}s`
          ) : (
            "RESEND CODE"
          )}
        </button>

        {/* Security badge */}
        <div style={S.badge}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l7 4v6c0 5-7 10-7 10S5 17 5 12V6l7-4z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          END-TO-END ENCRYPTED
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l7 4v6c0 5-7 10-7 10S5 17 5 12V6l7-4z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      <style>{`@keyframes orbit-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyEmailPage;
