import { motion } from "framer-motion";
import {
  Bell, Zap, MessageCircle, Settings, Music,
  Disc, Pause, Play, SkipBack, SkipForward, Volume2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { spotifyService } from "../services/spotifyService";
import { memo, useMemo, useState, useEffect } from "react";
import { ThemeMainContainer, ThemeCardWrapper } from "./welcome/WelcomeWrappers";
import { useThemeStore } from "../store/useThemeStore";
import { TruePastelDashboard } from "./welcome/PastelDreamBoard";
import { BusinessLightDashboard, GlowCurve, FloatingDust, ElegantSpotifyCard } from "./welcome/BusinessLightDashboard";
import OrbitApp from "../themes/amoledTheme";
import OrbitGrind from "../themes/gamerTheme";
import OrbitVampire from "../themes/darkTheme";
import OrbitNeonCyberpunk from "../themes/darkCyberpunkTheme";
import { createPortal } from "react-dom";
import { useNexusStore } from "../store/useNexusStore";
import NexusActionOverlay from "./NexusActionOverlay";

const themeColorMap = {
  gamer: "#ff2d78",
  pastel: "rgba(255,142,200,0.2)",
  default: "#7c3aed"
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

/**
 * Micro-component to isolate playback progress updates
 */
const MiniProgressBar = memo(() => {
  const positionMs = useSpotifyStore(s => s.positionMs);
  const durationMs = useSpotifyStore(s => s.durationMs);
  const isPlaying = useSpotifyStore(s => s.isPlaying);
  const [animatedPos, setAnimatedPos] = useState(positionMs);

  // Sync when positionMs changes from store
  useEffect(() => {
    setAnimatedPos(positionMs);
  }, [positionMs]);

  // Simulate smooth progress
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setAnimatedPos(prev => Math.min(prev + 1000, durationMs));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  const progress = durationMs > 0 ? (animatedPos / durationMs) * 100 : 0;

  return (
    <div className="relative z-10 h-0.5 w-full bg-[var(--chat-border)] rounded-full overflow-hidden mt-4">
      <div
        className="absolute left-0 top-0 h-full bg-[#1DB954] transition-all duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

});

const StarryBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          width: Math.random() * 1.5 + 0.5,
          height: Math.random() * 1.5 + 0.5,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
      />
    ))}
  </div>
));

const VolumeControl = memo(({ activeDeviceId }) => {
  const [volume, setVolume] = useState(70);

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVol = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    setVolume(newVol);
    if (activeDeviceId) {
      spotifyService.setVolume(activeDeviceId, newVol);
    }
  };

  return (
    <div className="flex items-center gap-2 group w-20">
      <Volume2 className="w-3.5 h-3.5 text-[var(--chat-muted)]" />
      <div
        onClick={handleVolume}
        className="flex-1 h-1 bg-[var(--chat-border)] rounded-full cursor-pointer relative"
      >
        <div className="absolute left-0 top-0 h-full bg-[var(--chat-text)] opacity-60 group-hover:bg-[#1DB954] rounded-full transition-all duration-150 group-hover:opacity-100" style={{ width: `${volume}%` }} />
      </div>
    </div>
  );

});

const SpotifyCard = memo(() => {
  const navigate = useNavigate();
  const spotifyLinked = useSpotifyStore(s => s.spotifyLinked);
  const currentTrack = useSpotifyStore(s => s.currentTrack);
  const isPlaying = useSpotifyStore(s => s.isPlaying);
  const activeDevice = useSpotifyStore(s => s.activeDevice);

  const { pausePlayback, playTrack, skipNext, skipPrevious } = useSpotifyStore();

  if (!spotifyLinked) {
    return (
      <motion.div variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }} className="h-full">
        <ThemeCardWrapper themeColorMap={{ gamer: "#00f5d4", pastel: "rgba(136,204,255,0.25)", default: "#1DB954" }} onClick={() => navigate("/spotify")} className="flex flex-col h-full min-h-[160px] p-6 relative justify-between overflow-hidden cursor-pointer">
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <Music className="w-6 h-6 text-[var(--bg-primary)]" />
            </div>
            <div className="size-1.5 rounded-full bg-[#1DB954]/50" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest mb-2 uppercase text-[var(--text-primary)]">SPOTIFY SYNC</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">Connect and share your listening experience in real-time</p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-end">
            <div className="h-px flex-1 bg-[var(--chat-border)]" />
            <Zap className="ml-4 size-3 text-[var(--chat-muted)]" />
          </div>
        </ThemeCardWrapper>
      </motion.div>
    );
  }

  if (!currentTrack) {
    return (
      <motion.div variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }} className="h-full">
        <ThemeCardWrapper themeColorMap={{ gamer: "#00f5d4", pastel: "rgba(136,204,255,0.25)", default: "#1DB954" }} onClick={() => navigate("/spotify")} className="flex flex-col items-center justify-center text-center h-full min-h-[160px]">
          <Disc className="w-10 h-10 text-[var(--chat-muted)] animate-spin-slow mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1DB954] opacity-90 leading-none">Ready to play</p>
          <p className="text-xs text-[var(--chat-muted)] font-bold mt-1">Select music to start sync</p>
        </ThemeCardWrapper>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }} className="h-full">
      <ThemeCardWrapper themeColorMap={{ gamer: "#00f5d4", pastel: "rgba(136,204,255,0.25)", default: "#1DB954" }} className="flex flex-col h-full min-h-[160px] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/10 opacity-30 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1DB954] text-[var(--chat-bg)]">
            <Music className="w-3 h-3 fill-current" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--chat-text)] opacity-90">Spotify Active</span>
        </div>
        <button onClick={() => navigate("/spotify")} className="text-[10px] font-black text-[#1DB954] hover:text-[#1ed760] transition-colors uppercase tracking-tight">Expand</button>
      </div>

      <div className="relative z-10 flex gap-4 mb-4">
        <div className="h-16 w-16 rounded-xl shadow-xl overflow-hidden flex-shrink-0 border border-[var(--chat-border)]">
          <img src={currentTrack.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-sm font-bold text-[var(--chat-text)] truncate leading-tight mb-1">{currentTrack.name}</h4>
          <p className="text-[10px] font-bold text-[var(--chat-muted)] truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Mini Controls */}
      <div className="relative z-10 flex items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors">
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); isPlaying ? pausePlayback() : playTrack(); }}
            className="h-8 w-8 rounded-full bg-[var(--chat-text)] text-[var(--color-base-100)] flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); skipNext(); }} className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors">
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        <VolumeControl activeDeviceId={activeDevice?.id} />
      </div>

      <MiniProgressBar />
      </ThemeCardWrapper>
    </motion.div>
  );
});


const NoChatSelected = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const infoBoxes = useMemo(() => [
    {
      id: 2,
      icon: MessageCircle,
      title: "Start Chatting",
      description: "Select a Constellation or create a private conversation",
      colors: { gamer: "#ff2bd6", pastel: "rgba(255,142,200,0.2)", default: "#a855f7" }
    },
    {
      id: 3,
      icon: Bell,
      title: "Get Notifications",
      description: "Stay updated with real-time alerts and messages",
      colors: { gamer: "#ff7a00", pastel: "rgba(255,204,136,0.3)", default: "#fb923c" }
    },
    {
      id: 4,
      icon: Settings,
      title: "Customize",
      description: "Configure your orbit behavior and preferences",
      action: () => navigate("/settings"),
      colors: { gamer: "#00cfff", pastel: "rgba(136,255,204,0.2)", default: "#0ea5e9" }
    },
  ], [navigate]);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const { nexusActionView, setNexusActionView } = useNexusStore();

  if (theme === "pastel-dream") {
    return <TruePastelDashboard />;
  }

  // All other themes (gamer, amoled, dark, neon) use the default dashboard content 
  // if no chat is selected. The shell is already provided by the theme loader.

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-transparent overflow-auto relative">
      {theme === "light" ? (
        <>
          <GlowCurve />
          <FloatingDust />
        </>
      ) : (
        <StarryBackground />
      )}

      {nexusActionView ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-4xl flex flex-col items-center justify-center relative min-h-0"
        >
          <ThemeMainContainer>
            <>
              <motion.div variants={itemVariants} className="text-left w-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-0.5 w-12 bg-[var(--text-secondary)]/60 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--chat-text)] opacity-90" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>Status: Online</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-[var(--chat-text)] uppercase leading-none" style={{ textShadow: '0 0 20px rgba(255,255,255,0.6)' }}>Welcome to Orbit</h1>
                <p className="text-[var(--chat-text)] opacity-80 text-xs mt-3 max-w-md font-bold">Choose a pathway to begin your mission.</p>
              </motion.div>

              <motion.div variants={containerVariants} className="w-full mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                  {theme === "light" ? <ElegantSpotifyCard onClick={() => navigate("/spotify")} /> : <SpotifyCard />}
                  {infoBoxes.map((box) => {
                    const Icon = box.icon;
                    return (
                      <motion.div key={box.id} variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }}>
                        <ThemeCardWrapper 
                          themeColorMap={{ gamer: box.colors.gamer, pastel: box.colors.pastel, default: box.colors.default }}
                          onClick={box.action}
                          className="flex flex-col h-full min-h-[160px] p-6 relative justify-between overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme === "light" ? "bg-[var(--chat-primary)]/10" : "bg-[var(--chat-text)]/10"} shadow-inner relative z-10`}>
                              <Icon className={`size-6 ${theme === "light" ? "text-[color-mix(in srgb,var(--color-base-content) 50%,transparent)]" : "text-[var(--chat-text)] opacity-80"}`} />
                              {/* Inject Screenshot Badge for Notifications */}
                              {theme === "light" && box.id === 3 && (
                                <div className="absolute -top-1.5 -right-1.5 bg-[#8b7355] text-[#f8f6f0] text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#f8f6f0] shadow-sm">3</div>
                              )}
                            </div>
                            
                            {/* Decorative Network Graph matching exactly the image for box.id===2 */}
                            {theme === "light" && box.id === 2 && (
                              <svg className="absolute top-1/2 left-10 -translate-y-1/2 w-40 h-20 opacity-60 pointer-events-none z-0" viewBox="0 0 100 60">
                                <path d="M0,30 L20,15 L40,40 L60,10 L80,35 L100,20" fill="none" stroke="var(--chat-primary)" strokeWidth="1" strokeDasharray="3 2" />
                                <circle cx="20" cy="15" r="2.5" fill="none" stroke="var(--chat-primary)" strokeWidth="1" />
                                <circle cx="40" cy="40" r="2.5" fill="var(--chat-primary)" />
                                <circle cx="60" cy="10" r="2.5" fill="none" stroke="var(--chat-primary)" strokeWidth="1" />
                                <circle cx="80" cy="35" r="2.5" fill="var(--chat-primary)" />
                                <circle cx="100" cy="20" r="2.5" fill="none" stroke="var(--chat-primary)" strokeWidth="1" />
                                <path d="M20,15 L40,10 L60,10" fill="none" stroke="var(--chat-primary)" strokeWidth="0.5" />
                                <path d="M40,40 L80,35" fill="none" stroke="var(--chat-primary)" strokeWidth="0.5" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black tracking-widest mb-2 uppercase text-[var(--chat-text)]">{box.title}</h3>
                            <p className="text-xs text-[var(--chat-muted)] leading-relaxed font-bold">{box.description}</p>
                          </div>
                          <div className="mt-auto pt-4 flex items-center justify-end">
                            <div className="h-px flex-1 bg-[var(--chat-border)]" />
                            <Zap className="ml-4 size-3 text-[var(--chat-muted)]" />
                          </div>
                        </ThemeCardWrapper>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          </ThemeMainContainer>
        </motion.div>
      )}
    </div>
  );
};

export default NoChatSelected;
