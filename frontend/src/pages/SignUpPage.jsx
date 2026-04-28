import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Sparkles, Star } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import { CyberAuthStyles, GlitchText, MorphInput } from "../components/CyberAuth";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp, authUser } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  // Redirect verified users to home, or unverified users to the verification screen
  useEffect(() => {
    if (authUser?.isEmailVerified) {
      navigate("/");
    } else if (authUser && !authUser.isEmailVerified) {
      navigate("/verify-email", { state: { email: authUser.email } });
    }
  }, [authUser, navigate]);

  const validateForm = () => {
    if (!formData.username.trim()) return toast.error("Username is required");
    if (formData.username.includes(" ")) return toast.error("No spaces in username");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email address");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!/[A-Z]/.test(formData.password)) return toast.error("Password must contain an uppercase letter");
    if (!/[a-z]/.test(formData.password)) return toast.error("Password must contain a lowercase letter");
    if (!/[0-9]/.test(formData.password)) return toast.error("Password must contain a number");
    if (!/[^A-Za-z0-9]/.test(formData.password)) return toast.error("Password must contain a special character");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    play("click");
    if (validateForm() !== true) return;
    const result = await signup(formData);
    if (result?.success) {
      navigate("/verify-email", { state: { email: formData.email } });
    }
  };

  // Password strength
  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "WEAK", "FAIR", "GOOD", "STRONG", "LETHAL"][pwStrength] || "";
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#a855f7"][pwStrength] || "";

  return (
    <>
      <CyberAuthStyles />

      {/* ── Header ─────────────────────────────── */}
      <div className="text-center flex flex-col items-center gap-2 mb-1">
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
              <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
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
          <GlitchText text="INITIALIZE IDENTITY" />
        </h1>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.25)",
        }}>
          REGISTER_NEW_NODE
        </p>
      </div>

      {/* ── Form ────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Username */}
        <MorphInput
          label="Username"
          type="text"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s+/g, "").toLowerCase() })}
          focused={focused === "username"}
          onFocus={() => setFocused("username")}
          onBlur={() => setFocused(null)}
        />

        {/* Email */}
        <MorphInput
          label="Email Address"
          type="email"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          focused={focused === "email"}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />

        {/* Password */}
        <div>
          <MorphInput
            label="Password"
            type={showPassword ? "text" : "password"}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            focused={focused === "password"}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { play("click"); setShowPassword(!showPassword); }}
              className="shrink-0 transition-colors duration-200"
              style={{ color: showPassword ? "#a78bfa" : "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </MorphInput>

          {/* Password strength bar */}
          {formData.password && (
            <div className="mt-2 px-1">
              <div className="flex gap-1 h-0.5">
                {[1,2,3,4,5].map((i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-300"
                    style={{ background: i <= pwStrength ? strengthColor : "rgba(255,255,255,0.08)" }}
                  />
                ))}
              </div>
              <p className="text-[9px] mt-1 transition-colors" style={{
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.15em",
                color: strengthColor
              }}>
                {strengthLabel}
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="cyber-submit-btn mt-1" disabled={isSigningUp}>
          {isSigningUp ? (
            <span className="flex items-center justify-center gap-3">
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "white",
                  animation: "spin-glow 0.7s linear infinite",
                }}
              />
              INITIALIZING...
            </span>
          ) : (
            <span className="relative z-10">REGISTER_NODE //</span>
          )}
        </button>
      </form>

      {/* ── Divider ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
      </div>

      {/* ── Constellation Auth ─────────────────── */}
      <Link
        to="/signup/constellation"
        className="w-full flex items-center justify-center gap-2"
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid rgba(139,92,246,0.2)",
          background: "rgba(139,92,246,0.05)",
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.15em",
          color: "rgba(167,139,250,0.8)",
          textDecoration: "none",
          transition: "all 0.25s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.12)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.05)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        TRY CONSTELLATION AUTH
      </Link>

      {/* ── StarWeave Auth ─────────────────── */}
      <Link
        to="/signup/starweave"
        className="w-full flex items-center justify-center gap-2"
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid rgba(192,100,255,0.2)",
          background: "rgba(192,100,255,0.05)",
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.15em",
          color: "rgba(192,100,255,0.8)",
          textDecoration: "none",
          transition: "all 0.25s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,100,255,0.12)"; e.currentTarget.style.borderColor = "rgba(192,100,255,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(192,100,255,0.05)"; e.currentTarget.style.borderColor = "rgba(192,100,255,0.2)"; }}
      >
        <Star className="w-3.5 h-3.5" />
        TRY STARWEAVE GESTURE
      </Link>

      {/* ── Footer ────────────────────────────────── */}
      <p className="text-center" style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>
        EXISTING_NODE?{" "}
        <Link to="/login" style={{ color: "#a78bfa", textDecoration: "none" }}>
          AUTHENTICATE →
        </Link>
      </p>
    </>
  );
};

export default SignUpPage;
