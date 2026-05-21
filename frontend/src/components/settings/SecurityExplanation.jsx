// Zero external imports — icons are inlined as raw SVGs to prevent
// Vite minifier "Cannot access X before initialization" crashes when
// this file is bundled in the same chunk as theme files.

const SecurityExplanation = ({ isDark = false }) => {
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "rgba(2,6,23,0.4)" : "rgba(255,255,255,0.6)";
  const borderColor = isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0";

  return (
    <div style={{
      padding: "2rem",
      borderRadius: "2rem",
      border: `1px solid ${borderColor}`,
      background: cardBg,
      backdropFilter: "blur(24px)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>

        {/* Shield icon — inline SVG */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>

        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: textColor, margin: 0 }}>
          Orbital Security Standard v4.0.0-PROD
        </h3>

        <p style={{ color: subTextColor, maxWidth: "28rem", margin: 0, lineHeight: 1.6 }}>
          Orbit is built on a zero-trust foundation. Every byte is sealed with mathematical certainty, ensuring absolute privacy from edge to edge.
        </p>

        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(16,185,129,0.2)" }}>

          {/* Lock icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "0.875rem", fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            E2E Encrypted
          </div>

          {/* Binary/Quantum icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#60a5fa", fontSize: "0.875rem", fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="14" y="14" width="4" height="6" rx="2"/>
              <rect x="14" y="4" width="4" height="6" rx="2"/>
              <rect x="6" y="14" width="4" height="6" rx="2"/>
              <path d="M6 4h4"/>
              <path d="M6 6h4"/>
              <path d="M6 8h4"/>
            </svg>
            Quantum Resistant
          </div>
        </div>

        {/* Security badges row */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
          {["X3DH Handshake", "Double Ratchet", "Argon2id Hashing", "Zero-Knowledge"].map((badge) => (
            <span key={badge} style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#10b981",
            }}>
              {badge}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SecurityExplanation;


