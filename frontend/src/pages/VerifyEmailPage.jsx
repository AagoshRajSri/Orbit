import { useState, useRef, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CyberAuthStyles } from "../components/CyberAuth";

const COOLDOWN = 60;

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

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => refs[0].current?.focus(), 100);
  }, []);

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
      setErrorMsg("Incorrect code — double-check and try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }, [email, verifyEmail, navigate]);

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

  return (
    <>
      <CyberAuthStyles />

      {/* ── Header ── */}
      <div className="text-center flex flex-col items-center gap-2 mb-1">
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
      </div>

      {/* ── Sub-text ── */}
      <p style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.05em",
        color: "rgba(255,255,255,0.3)",
        textAlign: "center",
        lineHeight: 1.7,
        margin: "8px 0 0",
      }}>
        A 6-digit code was sent to{" "}
        <span style={{ color: "rgba(167,139,250,0.8)", fontWeight: "600" }}>{email}</span>
      </p>

      {/* ── OTP Inputs ── */}
      <div className="flex flex-col gap-2">
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.2)",
          display: "block",
        }}>
          VERIFICATION_CODE
        </span>

        <div style={{ display: "flex", gap: "8px" }}>
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
                flex: 1,
                height: "60px",
                background: focused === i
                  ? "rgba(139,92,246,0.08)"
                  : d
                  ? "rgba(99,102,241,0.05)"
                  : "rgba(255,255,255,0.03)",
                border: focused === i
                  ? "1px solid rgba(167,139,250,0.6)"
                  : d
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                textAlign: "center",
                fontSize: "22px",
                fontWeight: "700",
                color: d ? "#a78bfa" : "rgba(255,255,255,0.8)",
                outline: "none",
                caretColor: "transparent",
                fontFamily: "'Inter', sans-serif",
                WebkitAppearance: "none",
                transition: "border-color 0.25s, background 0.25s",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.08em",
        color: "#f87171",
        minHeight: "14px",
        marginTop: "-4px",
      }}>
        {errorMsg}
      </div>

      {/* ── Submit button ── */}
      <button
        className="cyber-submit-btn"
        onClick={() => ready && !submitting && submit(code)}
        disabled={!ready || submitting}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-3">
            <span
              className="inline-block w-4 h-4 rounded-full"
              style={{
                border: "2px solid rgba(255,255,255,0.2)",
                borderTopColor: "white",
                animation: "spin-glow 0.7s linear infinite",
              }}
            />
            VERIFYING...
          </span>
        ) : (
          <span className="relative z-10">VERIFY_ACCESS //</span>
        )}
      </button>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
      </div>

      {/* ── Resend ── */}
      <button
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid rgba(139,92,246,0.15)",
          background: "rgba(139,92,246,0.04)",
          cursor: cooldown > 0 || resending ? "not-allowed" : "pointer",
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: cooldown > 0 || resending ? "rgba(255,255,255,0.2)" : "rgba(167,139,250,0.7)",
          transition: "all 0.25s",
          opacity: cooldown > 0 || resending ? 0.5 : 1,
        }}
        onMouseEnter={e => {
          if (cooldown === 0 && !resending) {
            e.currentTarget.style.background = "rgba(139,92,246,0.1)";
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(139,92,246,0.04)";
          e.currentTarget.style.borderColor = "rgba(139,92,246,0.15)";
        }}
      >
        {resending
          ? "SENDING..."
          : cooldown > 0
          ? `RESEND_IN_${cooldown}s`
          : "RESEND_CODE →"
        }
      </button>

      {/* ── Security badge ── */}
      <p className="text-center" style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.15)",
      }}>
        ◈ END_TO_END_ENCRYPTED ◈
      </p>
    </>
  );
};

export default VerifyEmailPage;
