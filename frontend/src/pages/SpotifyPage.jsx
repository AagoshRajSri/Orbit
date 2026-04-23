import { useState, useEffect } from "react";
import { LightSpotify } from "../themes/lightTheme";
import { Music, LogOut, ChevronLeft } from "lucide-react";
import SpotifyPlayer from "../components/SpotifyPlayer";
import SpotifySessionManager from "../components/SpotifySessionManager";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { spotifyService } from "../services/spotifyService";
import OrbitalPageWrapper from "../components/OrbitalPageWrapper";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";
import { GamerSpotify } from "../themes/gamerTheme";
import { CyberpunkSpotify } from "../themes/darkCyberpunkTheme";
import { VampireSpotify } from "../themes/darkTheme";
import { AmoledSpotify } from "../themes/amoledTheme";
export default function SpotifyPage() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { 
    isHost,
    spotifyProfile,
    setSpotifyProfile,
    spotifyLinked,
    disconnectSpotify
  } = useSpotifyStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionManager, setShowSessionManager] = useState(false);

  const isPastel = theme === "pastel-dream";
  const isAmoled = theme === "amoled-dark";

  useEffect(() => {
    const initialize = async () => {
      try {

        // Always fetch profile to check if linked
        if (!spotifyLinked) {
          const result = await spotifyService.getProfile();
          if (result?.linked) {
            setSpotifyProfile(result.profile);
          }
        }
      } catch (error) {
        console.error("Failed to initialize Spotify:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [spotifyLinked, setSpotifyProfile]);

  const handleConnectSpotify = async () => {
    try {
      await spotifyService.initiateLogin();
    } catch (error) {
      console.error("Failed to initiate Spotify auth:", error);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect Spotify?")) {
      try {
        await disconnectSpotify();
      } catch (error) {
        console.error("Failed to disconnect Spotify:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <OrbitalPageWrapper>
        <div className={`h-full flex items-center justify-center ${isAmoled ? "bg-[#000]" : ""}`}>
          <div className="text-center">
            <div className={`animate-spin inline-flex h-12 w-12 items-center justify-center rounded-full border-2 mb-4 ${isAmoled ? "border-[#4ECDC4]/30 border-t-[#4ECDC4]" : "border-green-500/30 border-t-green-500"}`} />
            <p className={`text-sm ${isAmoled ? "text-[#4ECDC4]/60 font-['Orbitron'] tracking-widest text-xs" : "text-base-content/60"}`}>{isAmoled ? "SYNCHRONIZING..." : "Loading Spotify..."}</p>
          </div>
        </div>
      </OrbitalPageWrapper>
    );
  }

  if (theme === "gamer-high-energy") {
    return <GamerSpotify />;
  }

  if (theme === "neon-cyberpunk") {
    return <CyberpunkSpotify />;
  }

  if (theme === "dark") {
    return <VampireSpotify />;
  }

  if (theme === "amoled-dark") {
    return <AmoledSpotify />;
  }

  if (theme === "light") {
    return <LightSpotify />;
  }

  if (!spotifyLinked) {
    /* ── Pastel / default connect screen ── */
    return (
      <OrbitalPageWrapper>
        <div className="h-full flex items-center justify-center p-4 relative"
          style={isPastel ? { background: "linear-gradient(145deg, #ffd4ee 0%, #f0ccf8 100%)", cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ctext y='24' font-size='24'%3E✨%3C/text%3E%3C/svg%3E\") 16 16, auto" } : {}}>
          {isPastel && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <span className="absolute top-1/4 left-1/4 text-4xl animate-bounce">💖</span>
              <span className="absolute bottom-1/4 right-1/4 text-3xl animate-pulse">✨</span>
              <span className="absolute top-1/2 right-1/3 text-2xl animate-spin-slow">🌸</span>
            </div>
          )}
          <div className={`w-full max-w-md p-8 rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col gap-6 relative transition-all duration-500 ${isPastel ? "bg-white/40 border-pink-200/50" : "border-white/5 bg-white/[0.02]"}`}>
            {isPastel ? (
              <>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-400/30 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-400/20 blur-[100px] rounded-full pointer-events-none" />
              </>
            ) : (
              <>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-green-500/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />
              </>
            )}
            <div className="relative z-10 text-center">
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg border mb-6 ${isPastel ? "from-pink-400 to-purple-500 border-pink-100" : "from-green-400 to-emerald-500 border-white/5"}`}>
                <Music className="w-8 h-8 text-white" />
              </div>
              <h1 className={`text-4xl font-black tracking-tight mb-3 ${isPastel ? "text-pink-600 drop-shadow-sm" : "text-base-content"}`}>
                Spotify Sync{isPastel && <span className="ml-2">✨</span>}
              </h1>
              <p className={`text-sm mb-8 leading-relaxed font-bold ${isPastel ? "text-purple-600/80" : "text-base-content/60"}`}>
                Connect your Spotify account to vibeee with the squad! 💅 Listen together, share sessions, and manifest the best music in real-time. 🎀
              </p>
              <ul className="space-y-4 mb-8 text-left inline-block">
                {["Play and control your jams 🎵", "Create cute shared sessions 💖", "Sync your vibe with everyone ✨"].map((feat, i) => (
                  <li key={i} className={`flex items-center gap-3 text-sm font-bold ${isPastel ? "text-pink-500" : "text-base-content/70"}`}>
                    <div className={`w-2 h-2 rounded-full ${isPastel ? "bg-pink-400 animate-pulse" : "bg-green-400"}`} />
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleConnectSpotify}
                className={`w-full px-6 py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${isPastel ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white shadow-pink-500/30" : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-green-500/40"}`}
              >
                <Music className="w-6 h-6" />
                CONNECT SPOTIFY ✨
              </button>
            </div>
          </div>
        </div>
      </OrbitalPageWrapper>
    );
  }
    return (
    <OrbitalPageWrapper>
      <div className={`h-full w-full flex flex-col transition-colors duration-500 ${isPastel ? "bg-[#fffafa]" : isAmoled ? "bg-[#000]" : "bg-[#090909]"}`}
           style={isPastel ? { cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ctext y='24' font-size='24'%3E✨%3C/text%3E%3C/svg%3E\") 16 16, auto" } : {}}>
        {/* Subtle top glow */}
        <div className={`absolute top-0 left-1/4 right-1/4 h-64 blur-[120px] pointer-events-none ${isPastel ? "bg-pink-300/30" : isAmoled ? "bg-[#4ECDC4]/10" : "bg-green-500/10"}`} />
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 relative z-10 border-b backdrop-blur-md transition-all
              ${theme === "pastel-dream" ? "border-pink-100 bg-white/40 shadow-sm" : "border-white/5 bg-black/20"}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className={`group flex items-center justify-center h-10 w-10 rounded-full border transition-all mr-2
                    ${theme === "pastel-dream" ? "bg-pink-50 border-pink-100 hover:bg-pink-100" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
              title="Back to Orbit"
            >
              <ChevronLeft className={`w-5 h-5 transition-colors ${theme === "pastel-dream" ? "text-pink-400 group-hover:text-pink-600" : "text-white/60 group-hover:text-green-500"}`} />
            </button>
            <div className="relative">
              <div className={`absolute inset-0 blur-xl opacity-20 animate-pulse ${theme === "pastel-dream" ? "bg-pink-500" : "bg-green-500"}`} />
              <div className={`relative h-12 w-12 flex items-center justify-center rounded-full shadow-lg transition-colors
                    ${theme === "pastel-dream" ? "bg-gradient-to-br from-pink-400 to-purple-400" : "bg-[#1DB954]"}`}>
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
                   <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.352-.674.463-1.025.249-2.857-1.745-6.452-2.14-10.686-1.171-.403.092-.806-.162-.899-.565-.092-.402.162-.806.565-.898 4.636-1.06 8.607-.611 11.796 1.338.351.214.463.673.249 1.047zm1.467-3.257c-.271.442-.846.582-1.288.311-3.27-2.007-8.256-2.589-12.122-1.416-.499.151-1.023-.133-1.174-.633-.151-.499.133-1.023.633-1.174 4.417-1.34 9.909-.691 13.639 1.602.443.271.583.847.312 1.31zm.126-3.411c-3.922-2.329-10.395-2.545-14.153-1.405-.6.181-1.237-.161-1.418-.761-.181-.6.161-1.237.761-1.418 4.304-1.306 11.455-1.053 15.986 1.636.539.319.715 1.014.396 1.553-.319.539-1.014.715-1.572.395z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isPastel ? "text-pink-600" : isAmoled ? "text-[#fff] font-['Orbitron'] tracking-[3px]" : "text-base-content"}`}>Spotify Sync 🎀</h1>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isPastel ? (isHost ? 'bg-pink-500' : 'bg-purple-500') : isAmoled ? (isHost ? 'bg-[#4ECDC4]' : 'bg-[#C6A06E]') : (isHost ? 'bg-green-500' : 'bg-blue-500')} animate-pulse`} />
                <p className={`text-[10px] uppercase font-bold tracking-widest ${isPastel ? "text-pink-400" : isAmoled ? "text-white/40" : "text-white/40"}`}>
                  {isHost ? (isAmoled ? "HOST ACTIVE // SYNC" : "Host Mode Active ✨") : (isAmoled ? "PARTICIPATING // LINKED" : "Participating ♡")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isHost && (
              <button
                onClick={() => setShowSessionManager(!showSessionManager)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all border shadow-sm
                      ${theme === "pastel-dream" 
                        ? (showSessionManager ? "bg-pink-500 text-white border-pink-400" : "bg-white text-pink-500 border-pink-100 hover:bg-pink-50")
                        : (showSessionManager ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}`}
              >
                {showSessionManager ? "CLOSE SETTINGS ♡" : "SESSION VIBES ✨"}
              </button>
            )}
            <div className={`h-8 w-[1px] mx-1 ${theme === "pastel-dream" ? "bg-pink-100" : "bg-white/10"}`} />
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right">
                <p className={`text-xs font-black leading-none ${theme === "pastel-dream" ? "text-pink-600" : "text-base-content"}`}>{spotifyProfile?.displayName}</p>
                <p className={`text-[10px] leading-none mt-1 font-bold ${theme === "pastel-dream" ? "text-purple-400" : "text-base-content/40"}`}>Premium Bestie ✨</p>
              </div>
              <img 
                src={spotifyProfile?.profileImage || `https://ui-avatars.com/api/?name=${spotifyProfile?.displayName}&background=${theme === "pastel-dream" ? 'ffaad8' : '1DB954'}&color=fff`} 
                className={`h-11 w-11 rounded-full border-2 p-0.5 shadow-md ${theme === "pastel-dream" ? "border-pink-200" : "border-[#1DB954]/20"}`}
                alt="Profile"
              />
              <button 
                onClick={handleDisconnect}
                className={`p-2.5 rounded-full transition-all border
                      ${theme === "pastel-dream" ? "bg-white border-pink-100 text-pink-300 hover:text-red-400 hover:bg-red-50" : "bg-white/5 border-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500"}`}
                title="Disconnect Spotify"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative z-10">
          {/* Left Session Pane (Sidebar style) */}
          {isHost && showSessionManager && (
            <div className={`w-80 border-r backdrop-blur-xl flex-shrink-0 animate-in slide-in-from-left duration-500 shadow-2xl z-20
                  ${theme === "pastel-dream" ? "bg-white/60 border-pink-50" : "bg-black/40 border-white/5"}`}>
              <SpotifySessionManager />
            </div>
          )}

          {/* Main Player Component */}
          <div className={`flex-1 min-w-0 transition-all duration-700
                ${theme === "pastel-dream" ? "bg-gradient-to-b from-[#fffafa] to-[#ffd4ee]" : "bg-gradient-to-b from-[#121212] to-[#000000]"}`}>
            <SpotifyPlayer />
          </div>
        </div>
      </div>
    </OrbitalPageWrapper>
  );
}
