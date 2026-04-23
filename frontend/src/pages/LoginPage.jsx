import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import { CyberAuthStyles, GlitchText, MorphInput } from "../components/CyberAuth";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, authUser } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) navigate("/");
  }, [authUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    play("click");
    login(formData);
  };

  return (
    <>
      <CyberAuthStyles />

      {/* ── Header ─────────────────────────────── */}
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
          <GlitchText text="ENTER THE SYSTEM" />
        </h1>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.25)",
        }}>
          AUTHENTICATE_SEQUENCE
        </p>
      </div>

      {/* ── Form ────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

        {/* Forgot password */}
        <div className="text-right" style={{ marginTop: "-4px" }}>
          <Link
            to="/forgot-password"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "rgba(167,139,250,0.5)",
              textDecoration: "none",
            }}
          >
            RECOVER_ACCESS →
          </Link>
        </div>

        {/* Submit */}
        <button type="submit" className="cyber-submit-btn" disabled={isLoggingIn}>
          {isLoggingIn ? (
            <span className="flex items-center justify-center gap-3">
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "white",
                  animation: "spin-glow 0.7s linear infinite",
                }}
              />
              AUTHENTICATING...
            </span>
          ) : (
            <span className="relative z-10">INITIATE_SESSION //</span>
          )}
        </button>
      </form>

      {/* ── Divider ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
      </div>

      {/* ── Alternative Auth Methods ─────────────────── */}
      <div className="flex gap-2 w-full">
        <Link
          to="/login/constellation"
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid rgba(139,92,246,0.2)",
            background: "rgba(139,92,246,0.05)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.1em",
            color: "rgba(167,139,250,0.8)",
            textDecoration: "none",
            transition: "all 0.25s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.12)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.05)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}
        >
          <Sparkles className="w-3 h-3" />
          CONSTELLATION
        </Link>

        <Link
          to="/login/starweave"
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid rgba(56,189,248,0.2)",
            background: "rgba(56,189,248,0.05)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.1em",
            color: "rgba(125,211,252,0.8)",
            textDecoration: "none",
            transition: "all 0.25s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(56,189,248,0.12)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(56,189,248,0.05)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.2)"; }}
        >
          <Sparkles className="w-3 h-3" />
          STARWEAVE
        </Link>
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <p className="text-center" style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>
        NO_ACCOUNT?{" "}
        <Link to="/signup" style={{ color: "#a78bfa", textDecoration: "none" }}>
          REGISTER_NODE →
        </Link>
      </p>
    </>
  );
};

export default LoginPage;
