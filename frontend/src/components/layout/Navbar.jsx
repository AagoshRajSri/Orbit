import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { LogOut, Settings, User, Menu } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";
import Saturn from "../effects/Saturn";


const NavbarCat = () => (
  <div className="absolute left-1/2 -translate-x-1/2 navbar-cat-group group/cat cursor-pointer top-1 h-12 w-12 flex items-center justify-center z-20">
    <div className="relative transition-transform duration-500 group-hover/cat:scale-[1.35]">
      <div className="absolute inset-0 bg-[#ff9248]/30 blur-2xl rounded-full opacity-0 group-hover/cat:opacity-100 transition-opacity" />
      <svg viewBox="0 0 200 200" className="w-12 h-12 overflow-visible" style={{ color: "#ff9248" }}>
        <path fill="currentColor" d="M100,180 Q60,180 60,130 Q60,80 100,80 Q140,80 140,130 Q140,180 100,180 Z" />
        <circle fill="currentColor" cx="100" cy="70" r="35" />
        <path fill="currentColor" d="M70,55 L75,20 L95,45 Z" />
        <path fill="currentColor" d="M130,55 L125,20 L105,45 Z" />
        <circle fill="#222" cx="85" cy="70" r="4" />
        <circle fill="#222" cx="115" cy="70" r="4" />
        <circle fill="#ffb7d5" cx="100" cy="80" r="3" />
        <path 
          className="wag-tail" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="12" 
          strokeLinecap="round" 
          d="M130,160 Q170,160 160,110" 
          style={{ 
            transformOrigin: "130px 160px",
            transition: "all 0.3s ease"
          }} 
        />
      </svg>
    </div>
    <style>{`
      .navbar-cat-group:hover .wag-tail {
        animation: catTailWag 0.3s ease-in-out infinite alternate !important;
      }
      @keyframes catTailWag {
        0% { transform: rotate(-8deg); }
        100% { transform: rotate(38deg); }
      }
    `}</style>
  </div>
);

const Navbar = ({ onHamburger }) => {
  const { logout, authUser } = useAuthStore();
  const { theme } = useThemeStore();

  const isPastel = theme === "pastel-dream";
  const isGamer = theme === "gamer-high-energy";
  const isCyber = theme === "neon-cyberpunk";
  const isAmoled = theme === "amoled-dark";
  const isLight = theme === "light";

  return (
    <header className={`fixed top-0 inset-x-0 z-[110] h-14 ${isPastel 
      ? "bg-white/10 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_rgba(var(--p),0.05)]" 
      : isCyber
        ? "border-b border-[rgba(0,245,212,0.25)] bg-[rgba(4,2,18,0.95)] backdrop-blur-xl"
      : isGamer 
        ? "border-b border-[#00f5d4]/40 bg-black/80 backdrop-blur-md"
      : isAmoled
        ? "bg-black border-b border-white/[0.08]"
      : isLight
        ? "bg-[#f8f6f0]/90 backdrop-blur-xl border-b border-[#b08d57]/20 shadow-[0_2px_20px_rgba(176,141,87,0.08)]"
        : "bg-base-100/80 backdrop-blur-md border-b border-base-300/60"}`}>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes starPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
      
      <div className="h-full px-5 max-w-[1500px] mx-auto flex items-center justify-between group/nav relative">
        {/* Shimmer effect for navbar */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-[200%] -translate-x-[100%] group-hover/nav:translate-x-[100%] transition-all duration-[2000ms] pointer-events-none" />

        <div className="flex items-center gap-4 min-w-0 relative z-10">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-100 transition-all active:scale-95 px-2 py-1 group/logo"
          >
            {isPastel ? (
              <>
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/40 to-purple-400/40 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
                  <div className="size-10 rounded-2xl bg-gradient-to-br from-[#ff80b5] via-[#c084fc] to-[#818cf8] flex items-center justify-center text-xl shadow-lg shadow-pink-300/40 relative z-10 transition-all duration-500 group-hover/logo:rotate-12 group-hover/logo:scale-110">
                    🌸
                  </div>
                </div>
                <div className="flex flex-col leading-tight">
                  <h1
                    style={{ fontFamily: "'Pacifico', cursive" }}
                    className="text-[1.45rem] leading-none bg-gradient-to-r from-[#f472b6] via-[#c084fc] to-[#818cf8] bg-clip-text text-transparent drop-shadow-[0_1px_6px_rgba(244,114,182,0.35)]"
                  >
                    Orbit
                  </h1>
                  <span
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                    className="text-[11px] text-pink-400/70 leading-none mt-0.5"
                  >
                    ✦ your pastel universe ✦
                  </span>
                </div>
              </>
            ) : isCyber ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#ff2d78] shadow-[0_0_10px_#ff2d78] bg-[#ff2d78]/10 flex items-center justify-center font-black text-[#ff2d78]">
                   O
                </div>
                <h1 className="text-lg font-black tracking-[0.2em] text-[#00f5d4] uppercase font-orbitron drop-shadow-[0_0_10px_rgba(0,245,212,0.6)]">
                  Orbit
                </h1>
              </div>
            ) : isCyber ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#ff2d78] shadow-[0_0_10px_#ff2d78] bg-[#ff2d78]/10 flex items-center justify-center font-black text-[#ff2d78]">
                   O
                </div>
                <h1 className="text-lg font-black tracking-[0.2em] text-[#00f5d4] uppercase font-orbitron drop-shadow-[0_0_10px_rgba(0,245,212,0.6)]">
                  Orbit
                </h1>
              </div>
            ) : isGamer ? (
              <>
                <div className="w-8 h-8 flex items-center justify-center text-[#ff2d78] text-xl font-black drop-shadow-[0_0_8px_rgba(255,45,120,0.8)]">O</div>
                <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00f5d4] to-[#00cfff] uppercase drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]">Orbit</h1>
              </>
            ) : theme === "light" ? (
              <>
                <div className="w-10 h-10 flex items-center justify-center">
                  <Saturn size={32} tilt={-20} />
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate text-[var(--chat-text)] luxury-text">
                  ORBIT
                </h1>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shadow-lg">
                  <img loading="lazy" decoding="async" src="/logo.jpg" alt="Orbit logo" className="w-8 h-8 object-contain" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate text-[var(--chat-text)]">Orbit</h1>
              </>
            )}
          </Link>
        </div>

        {/* Center Cat */}
        {isPastel && <NavbarCat />}

      <div className="flex items-center gap-2 relative z-10">
          {/* Mobile hamburger — opens sidebar drawer */}
          {onHamburger && (
            <button
              onClick={onHamburger}
              className={`md:hidden h-10 w-10 rounded-[1.2rem] border flex items-center justify-center transition-all ${
                isPastel
                  ? "border-pink-300/40 bg-gradient-to-r from-pink-50 to-purple-50 text-[#d946a8]"
                  : isCyber
                  ? "border-[rgba(0,245,212,0.4)] bg-[rgba(0,245,212,0.08)] text-[#a0f0e8]"
                  : isGamer
                  ? "border-[var(--chat-primary)]/40 bg-[var(--chat-primary)]/10 text-[var(--chat-primary)]"
                  : isAmoled
                  ? "border-white/[0.08] bg-white/[0.04] text-white/70"
                  : isLight
                  ? "border-[#b08d57]/30 bg-[rgba(176,141,87,0.06)] text-[#8c7055]"
                  : "border-base-300/70 bg-base-100/30"
              }`}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
          )}
          <Link
            to={"/settings"}
            className={`h-10 px-4 rounded-[1.2rem] border transition-all duration-300 text-xs flex items-center gap-2.5 font-bold group/btn ${isPastel 
              ? "border-pink-300/40 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-[#d946a8] hover:border-pink-400/60 shadow-sm hover:shadow-pink-200/60 hover:shadow-md hover:scale-[1.04] active:scale-95" 
              : isCyber
                ? "border-[rgba(0,245,212,0.4)] bg-[rgba(0,245,212,0.08)] hover:bg-[rgba(0,245,212,0.15)] text-[#a0f0e8] rounded-none font-orbitron uppercase tracking-widest"
              : isGamer 
                ? "border-[var(--chat-primary)]/40 bg-[var(--chat-primary)]/10 hover:bg-[var(--chat-primary)]/20 text-[var(--chat-primary)] rounded-none"
              : isAmoled
                ? "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.18] rounded-xl"
              : isLight
                ? "border-[#b08d57]/30 bg-[rgba(176,141,87,0.06)] hover:bg-[rgba(176,141,87,0.12)] text-[#8c7055] hover:text-[#6b5340] hover:border-[#b08d57]/50 rounded-xl tracking-widest uppercase"
                : "border-base-300/70 bg-base-100/30 hover:bg-base-200/40"}`}
          >
            {isPastel ? (
              <span className="text-sm group-hover/btn:rotate-90 transition-transform duration-500">⚙️</span>
            ) : (
              <Settings className={`w-4 h-4 ${isCyber ? "text-[#00f5d4]" : isAmoled ? "text-[#00D4FF]" : ""}`} />
            )}
            <span className={`hidden sm:inline uppercase tracking-widest font-black text-[10px] ${isCyber ? "text-[8.5px]" : ""}`}>Settings</span>
          </Link>

          {authUser && (
            <>
              <Link
                to={"/profile"}
                className={`h-10 px-4 rounded-[1.2rem] border transition-all duration-300 text-xs flex items-center gap-2.5 font-bold group/btn ${isPastel 
                  ? "border-purple-300/40 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-[#9333ea] hover:border-purple-400/60 shadow-sm hover:shadow-purple-200/60 hover:shadow-md hover:scale-[1.04] active:scale-95" 
                  : isCyber
                    ? "border-[rgba(0,245,212,0.4)] bg-[rgba(0,245,212,0.08)] hover:bg-[rgba(0,245,212,0.15)] text-[#a0f0e8] rounded-none font-orbitron uppercase tracking-widest"
                  : isGamer 
                    ? "border-[var(--chat-primary)]/40 bg-[var(--chat-primary)]/10 hover:bg-[var(--chat-primary)]/20 text-[var(--chat-primary)] rounded-none"
                  : isAmoled
                    ? "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.18] rounded-xl"
                  : isLight
                    ? "border-[#b08d57]/30 bg-[rgba(176,141,87,0.06)] hover:bg-[rgba(176,141,87,0.12)] text-[#8c7055] hover:text-[#6b5340] hover:border-[#b08d57]/50 rounded-xl tracking-widest uppercase"
                    : "border-base-300/70 bg-base-100/30 hover:bg-base-200/40"}`}
              >
                {isPastel ? (
                  <span className="text-sm group-hover/btn:scale-125 transition-transform duration-300">🦋</span>
                ) : (
                  <User className={`w-4 h-4 ${isCyber ? "text-[#00f5d4]" : isAmoled ? "text-[#00D4FF]" : ""}`} />
                )}
                <span className={`hidden sm:inline uppercase tracking-widest font-black text-[10px] ${isCyber ? "text-[8.5px]" : ""}`}>Profile</span>
              </Link>

              <button
                className={`h-10 px-4 rounded-[1.2rem] border transition-all duration-300 text-xs flex items-center gap-2.5 font-bold group/btn ${isPastel 
                  ? "border-rose-300/40 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-rose-500 hover:border-rose-400/60 shadow-sm hover:shadow-rose-200/50 hover:shadow-md hover:scale-[1.04] active:scale-95" 
                  : isCyber
                    ? "border-[rgba(255,45,120,0.6)] bg-[rgba(255,45,120,0.12)] hover:bg-[rgba(255,45,120,0.2)] text-[#ff2d78] rounded-none font-orbitron uppercase tracking-widest"
                  : isGamer 
                    ? "border-[var(--chat-primary)]/40 bg-[var(--chat-primary)]/10 hover:bg-[var(--chat-primary)]/20 text-[var(--chat-primary)] rounded-none"
                  : isAmoled
                    ? "border-[#FF5555]/25 bg-[#FF5555]/5 hover:bg-[#FF5555]/10 text-[#FF5555]/80 hover:text-[#FF5555] hover:border-[#FF5555]/50 rounded-xl"
                  : isLight
                    ? "border-[#9b4b4b]/25 bg-[rgba(155,75,75,0.05)] hover:bg-[rgba(155,75,75,0.10)] text-[#9b4b4b]/80 hover:text-[#9b4b4b] hover:border-[#9b4b4b]/40 rounded-xl tracking-widest uppercase"
                    : "border-base-300/70 bg-base-100/30 hover:bg-base-200/40"}`}
                onClick={logout}
              >
                {isPastel ? (
                  <span className="text-sm group-hover/btn:translate-x-1 transition-transform">💫</span>
                ) : (
                  <LogOut className={`w-4 h-4 ${isCyber ? "text-[#ff2d78]" : isAmoled ? "text-[#FF5555]" : ""}`} />
                )}
                <span className={`hidden sm:inline uppercase tracking-widest font-black text-[10px] ${isCyber ? "text-[8.5px]" : ""}`}>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
