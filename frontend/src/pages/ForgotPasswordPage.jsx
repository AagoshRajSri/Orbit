import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useSoundManager } from "../hooks/useSoundManager";
import { CyberAuthStyles, MorphInput } from "../components/CyberAuth";

const STEPS = ["email", "otp", "reset"];

const STEP_LABELS = { email: "LOCATE_NODE", otp: "VERIFY_TOKEN", reset: "RESET_CIPHER" };

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { play } = useSoundManager();
  const [step, setStep] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const currentStepIndex = STEPS.indexOf(step);

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Invalid email format");
    setLoading(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email");
      setStep("otp"); setTimer(300); startTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await axiosInstance.post("/auth/verify-otp", { email, otp });
      toast.success("OTP verified");
      setStep("reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return toast.error("Min. 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await axiosInstance.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Password reset! Sign in now.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <>
      <CyberAuthStyles />

      {/* ── Header ───────────────────────────── */}
      <div className="flex flex-col items-center gap-2 mb-1">
        {/* back link */}
        <Link
          to="/login"
          className="self-start flex items-center gap-1.5"
          style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(167,139,250,0.5)", textDecoration: "none" }}
        >
          ← ABORT
        </Link>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: "800", color: "white", letterSpacing: "-0.01em", textAlign: "center" }}>
          RECOVER_ACCESS
        </h1>

        {/* Step progress */}
        <div className="flex items-center gap-0 w-full max-w-[220px]">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className="flex flex-col items-center gap-1"
                style={{ flex: "0 0 auto" }}
              >
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  border: i <= currentStepIndex ? "1px solid rgba(167,139,250,0.8)" : "1px solid rgba(255,255,255,0.1)",
                  background: i === currentStepIndex ? "rgba(139,92,246,0.25)" : i < currentStepIndex ? "rgba(139,92,246,0.15)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i < currentStepIndex ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: i <= currentStepIndex ? "#a78bfa" : "rgba(255,255,255,0.2)" }}>
                      {i + 1}
                    </span>
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: "1px",
                  background: i < currentStepIndex ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.07)",
                  transition: "background 0.4s",
                }} />
              )}
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)" }}>
          {STEP_LABELS[step]}
        </p>
      </div>

      {/* ── Step 1: Email ─────────────────────── */}
      {step === "email" && (
        <form onSubmit={handleSendOTP} className="flex flex-col gap-3">
          <MorphInput
            label="Email Address"
            type="email"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            focused={focused === "email"}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
          />
          <button type="submit" className="cyber-submit-btn" disabled={loading}>
            {loading ? <span className="flex items-center justify-center gap-3"><div className="beating-loader" /> SCANNING...</span>
              : <span className="relative z-10">SEND_OTP //</span>}
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ─────────────────────── */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
          {/* Readonly email */}
          <div style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)" }}>
              {email}
            </span>
          </div>

          <MorphInput
            label="6-Digit OTP"
            type="text"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            focused={focused === "otp"}
            onFocus={() => setFocused("otp")}
            onBlur={() => setFocused(null)}
          />

          {timer > 0 && (
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(167,139,250,0.5)", textAlign: "center" }}>
              OTP expires in {formatTimer(timer)}
            </p>
          )}

          <button type="submit" className="cyber-submit-btn" disabled={loading}>
            {loading ? <span className="flex items-center justify-center gap-3"><div className="beating-loader" /> VERIFYING...</span>
              : <span className="relative z-10">VERIFY_TOKEN //</span>}
          </button>

          {timer === 0 && (
            <button type="button" onClick={handleSendOTP}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(167,139,250,0.5)", background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
              RESEND_OTP →
            </button>
          )}
        </form>
      )}

      {/* ── Step 3: Reset ─────────────────────── */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
          <MorphInput
            label="New Password"
            type={showPassword ? "text" : "password"}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            focused={focused === "newPassword"}
            onFocus={() => setFocused("newPassword")}
            onBlur={() => setFocused(null)}
          >
            <button type="button" tabIndex={-1} onClick={() => { play("click"); setShowPassword(!showPassword); }}
              style={{ color: showPassword ? "#a78bfa" : "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </MorphInput>

          <MorphInput
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            focused={focused === "confirmPassword"}
            onFocus={() => setFocused("confirmPassword")}
            onBlur={() => setFocused(null)}
          >
            <button type="button" tabIndex={-1} onClick={() => { play("click"); setShowConfirm(!showConfirm); }}
              style={{ color: showConfirm ? "#a78bfa" : "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </MorphInput>

          <button type="submit" className="cyber-submit-btn" disabled={loading}>
            {loading ? <span className="flex items-center justify-center gap-3"><div className="beating-loader" /> RESETTING...</span>
              : <span className="relative z-10">RESET_CIPHER //</span>}
          </button>
        </form>
      )}

      {/* ── Footer ───────────────────────────── */}
      <p className="text-center" style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>
        REMEMBERED?{" "}
        <Link to="/login" style={{ color: "#a78bfa", textDecoration: "none" }}>
          AUTHENTICATE →
        </Link>
      </p>
    </>
  );
};

export default ForgotPasswordPage;
