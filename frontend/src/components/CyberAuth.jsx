

export function CyberAuthStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
      
      .cyber-submit-btn {
        position: relative;
        overflow: hidden;
        width: 100%;
        padding: 16px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        font-family: 'Outfit', sans-serif;
        font-size: 13px;
        letter-spacing: 0.1em;
        font-weight: 600;
        color: white;
        background: #4f46e5;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .cyber-submit-btn:hover { 
        background: #4338ca;
        transform: translateY(-1px); 
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      }
      .cyber-submit-btn:active { transform: translateY(0); }
      .cyber-submit-btn:disabled { 
        background: #312e81;
        opacity: 0.6; 
        cursor: not-allowed; 
      }
    `}</style>
  );
}

export function GlitchText({ text }) {
  return (
    <span className="font-bold tracking-tight">
      {text}
    </span>
  );
}

export function MorphInput({ label, type, icon, value, onChange, focused, onFocus, onBlur, children }) {
  const filled = value.length > 0;
  return (
    <div className="relative group" onClick={onFocus}>
      <div
        className="relative overflow-hidden transition-all duration-500 cursor-text"
        style={{
          background: focused
            ? "rgba(139,92,246,0.08)"
            : filled
            ? "rgba(99,102,241,0.05)"
            : "rgba(255,255,255,0.03)",
          border: focused
            ? "1px solid rgba(167,139,250,0.6)"
            : filled
            ? "1px solid rgba(99,102,241,0.3)"
            : "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "0",
        }}
      >
        {/* Scan line effect when focused */}
        {focused && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, rgba(139,92,246,0.04) 50%, transparent 60%)",
              animation: "scanline 2s linear infinite",
            }}
          />
        )}

        <div className="flex items-center px-5 gap-4" style={{ minHeight: "60px" }}>
          <span
            className="text-lg transition-all duration-300 shrink-0"
            style={{
              color: focused
                ? "#a78bfa"
                : filled
                ? "#818cf8"
                : "rgba(255,255,255,0.2)",
              transform: focused ? "scale(1.1)" : "scale(1)",
            }}
          >
            {icon}
          </span>

          <div className="flex-1 relative">
            <label
              className="absolute transition-all duration-300 pointer-events-none font-medium"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: focused || filled ? "10px" : "13px",
                top: focused || filled ? "4px" : "50%",
                transform: focused || filled ? "translateY(0)" : "translateY(-50%)",
                color: focused
                  ? "#818cf8"
                  : filled
                  ? "rgba(129,140,248,0.7)"
                  : "rgba(255,255,255,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              {label.toUpperCase()}
            </label>
            <input
              type={type}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              className="w-full bg-transparent outline-none"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                color: "#f8fafc",
                paddingTop: focused || filled ? "16px" : "0",
                caretColor: "#818cf8",
                letterSpacing: type === "password" ? "0.15em" : "0",
              }}
            />
          </div>

          {/* Eye toggle button space for password */}
          {children}

          {/* Pulse indicator */}
          {focused && !children && (
            <div className="shrink-0 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: "3px",
                    height: "3px",
                    background: "#a78bfa",
                    animation: `pulse-bar 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom progress line */}
        <div
          className="absolute bottom-0 left-0 h-px transition-all duration-500"
          style={{
            width: focused ? "100%" : filled ? "60%" : "0%",
            background: "linear-gradient(90deg, #7c3aed, #6366f1)",
          }}
        />
      </div>
    </div>
  );
}
