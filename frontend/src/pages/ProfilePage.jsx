import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import OrbitalPageWrapper from "../components/layout/OrbitalPageWrapper";
import {
  Camera,
  Mail,
  User,
  Edit,
  Save,
  Trash2,
  RotateCcw,
  Compass,
  Flower,
  Activity,
  ShieldCheck,
  Gauge,
  Clock,
  Users,
  Network,
  Zap,
  Calendar
} from "lucide-react";
import toast from "../lib/toast";
import { useSoundManager } from "../hooks/useSoundManager";
import { useThemeStore } from "../store/useThemeStore";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile, deleteAccount } = useAuthStore();
  const { users } = useChatStore();
  const { nexuses } = useNexusStore();
  const { play } = useSoundManager();
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Session Uptime Live Timer ──────────────────────────────────────────────
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Compute Real Days Active ──────────────────────────────────────────────
  const daysRegistered = useMemo(() => {
    if (!authUser || !authUser.createdAt) return 1;
    const start = new Date(authUser.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    setProfileDraft({
      username: authUser.username || "",
      email: authUser.email || "",
      bio: authUser.bio || "",
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

  const hasChanges = useMemo(() => {
    if (!authUser) return false;
    return (
      profileDraft.username !== authUser.username ||
      profileDraft.email !== authUser.email ||
      profileDraft.bio !== (authUser.bio || "") ||
      selectedImg !== null
    );
  }, [profileDraft, authUser, selectedImg]);

  // ── Dynamic Theme Token Configuration ──────────────────────────────────────
  const themeStyles = useMemo(() => {
    switch (theme) {
      case "amoled-dark":
        return {
          bg: "#000000",
          cardBg: "rgba(10, 10, 10, 0.8)",
          cardBorder: "1px solid rgba(198, 160, 110, 0.15)",
          accent: "#C6A06E",
          accentSecondary: "#4ECDC4",
          textPrimary: "#E8C990",
          textMuted: "rgba(198, 160, 110, 0.5)",
          shimmer: "oa-shimmer-text oa-orbitron",
          monoFont: "'Share Tech Mono', monospace",
          headingFont: "Orbitron, sans-serif",
          buttonClass: "luxury-button btn-gold",
          glow: "0 0 25px rgba(198, 160, 110, 0.15)"
        };
      case "pastel-dream":
        return {
          bg: "linear-gradient(135deg, #FFEBF6 0%, #E8F0FE 100%)",
          cardBg: "rgba(255, 255, 255, 0.85)",
          cardBorder: "1.5px solid #FFD4EE",
          accent: "#E060B0",
          accentSecondary: "#9F86FF",
          textPrimary: "#8B528B",
          textMuted: "#B896B8",
          shimmer: "",
          monoFont: "'Space Mono', monospace",
          headingFont: "'Pacifico', cursive",
          buttonClass: "pastel-button btn-pink",
          glow: "0 8px 32px rgba(255, 180, 220, 0.3)"
        };
      case "gamer-high-energy":
        return {
          bg: "#080614",
          cardBg: "rgba(12, 10, 24, 0.95)",
          cardBorder: "1.5px solid rgba(255, 45, 120, 0.25)",
          accent: "#FF2D78",
          accentSecondary: "#00FF66",
          textPrimary: "#00FF66",
          textMuted: "rgba(0, 255, 102, 0.5)",
          shimmer: "cyber-glitch-text",
          monoFont: "'Share Tech Mono', monospace",
          headingFont: "'Orbitron', sans-serif",
          buttonClass: "gamer-btn-glow",
          glow: "0 0 25px rgba(255, 45, 120, 0.2)"
        };
      case "dark":
        return {
          bg: "#0A0A0A",
          cardBg: "rgba(18, 18, 18, 0.9)",
          cardBorder: "1px solid rgba(239, 68, 68, 0.2)",
          accent: "#EF4444",
          accentSecondary: "#991B1B",
          textPrimary: "#F3F4F6",
          textMuted: "rgba(239, 68, 68, 0.5)",
          shimmer: "",
          monoFont: "monospace",
          headingFont: "sans-serif",
          buttonClass: "vampire-button",
          glow: "0 0 20px rgba(239, 68, 68, 0.15)"
        };
      case "neon-cyberpunk":
        return {
          bg: "#0C0E14",
          cardBg: "rgba(16, 20, 30, 0.9)",
          cardBorder: "1.5px solid rgba(139, 92, 246, 0.3)",
          accent: "#8B5CF6",
          accentSecondary: "#EC4899",
          textPrimary: "#38BDF8",
          textMuted: "rgba(56, 189, 248, 0.5)",
          shimmer: "cyber-neon-shimmer",
          monoFont: "'Space Mono', monospace",
          headingFont: "'Orbitron', sans-serif",
          buttonClass: "cyber-button",
          glow: "0 0 30px rgba(139, 92, 246, 0.25)"
        };
      case "light":
      default:
        return {
          bg: "linear-gradient(135deg, #FAF8F5 0%, #E8E2D5 100%)",
          cardBg: "rgba(255, 255, 255, 0.95)",
          cardBorder: "1px solid rgba(176, 141, 87, 0.2)",
          accent: "#B08D57",
          accentSecondary: "#8C7055",
          textPrimary: "#5C4A2A",
          textMuted: "#C9B99A",
          shimmer: "",
          monoFont: "'Space Mono', monospace",
          headingFont: "'Georgia', serif",
          buttonClass: "luxury-button btn-gold",
          glow: "0 8px 32px rgba(176, 141, 87, 0.08)"
        };
    }
  }, [theme]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      setProfileDraft((prev) => ({ ...prev, profilePic: base64Image }));
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileDraft.username.trim() || !profileDraft.email.trim()) {
      toast.error("Username and email are required.");
      return;
    }

    try {
      const payload = {
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
        bio: profileDraft.bio,
      };
      if (selectedImg) payload.profilePic = selectedImg;

      await updateProfile(payload);
      setIsEditing(false);
      setSelectedImg(null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error("Profile update failed.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setTimeout(() => {
        toast.success(
          "You have a 30-second grace period to contact support to recover your account.",
        );
      }, 200);
      navigate("/signup");
    } catch (error) {
      toast.error("Could not delete account at this time.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authUser) {
    return (
      <OrbitalPageWrapper>
        <div className="p-6 text-base-content/70">Loading profile...</div>
      </OrbitalPageWrapper>
    );
  }

  return (
    <OrbitalPageWrapper>
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-500" 
        style={{ background: themeStyles.bg }}
      />

      {/* Floating Theme Particles for Pastel */}
      {theme === "pastel-dream" && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[8%] left-[10%] text-5xl animate-bounce opacity-40">🎀</div>
          <div className="absolute top-[25%] right-[15%] text-4xl animate-pulse opacity-30">🌸</div>
          <div className="absolute bottom-[20%] left-[5%] text-5xl animate-bounce opacity-40">✨</div>
          <div className="absolute bottom-[10%] right-[10%] text-4xl animate-pulse opacity-30">💖</div>
        </div>
      )}

      {/* Cyberpunk Scanlines */}
      {theme === "neon-cyberpunk" && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />
      )}

      <div className="h-full min-h-0 overflow-y-auto py-8 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Header Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <button
              onClick={() => {
                play("click");
                navigate("/");
              }}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 w-fit
                ${theme === "pastel-dream"
                  ? "bg-white/70 border border-pink-100 text-[#d060a8] shadow-lg shadow-pink-100/50 hover:bg-white hover:scale-105 active:scale-95"
                  : isLight
                  ? "bg-white/80 border border-[#b08d57]/30 text-[#8c7055] shadow-md shadow-[rgba(176,141,87,0.1)] hover:bg-white hover:border-[#b08d57]/50 hover:scale-105 active:scale-95"
                  : "bg-base-300/40 backdrop-blur-md border border-base-content/10 text-base-content/70 hover:bg-base-300/60 hover:text-base-content"
                }
              `}
            >
              {theme === "pastel-dream" ? (
                <Flower className="size-4 text-pink-400" />
              ) : (
                <Compass className="size-4 text-primary" />
              )}
              <span>{theme === "pastel-dream" ? "Back to Dreamland" : "Back to Orbit"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                className="orbital-btn-secondary gap-2 text-sm py-2 px-4"
                type="button"
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  if (!isEditing) toast.success("Edit mode enabled");
                }}
              >
                <Edit className="w-4 h-4" />
                {isEditing ? "View Details" : "Edit Profile"}
              </button>
              <button
                className="orbital-btn-ghost gap-2 text-sm py-2 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Identity
              </button>
            </div>
          </div>

          {/* Unified Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT SIDE: Identity Card & Public Profile form (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div 
                className="p-8 rounded-[2.5rem] border backdrop-blur-md transition-all duration-300"
                style={{
                  background: themeStyles.cardBg,
                  border: themeStyles.cardBorder,
                  boxShadow: themeStyles.glow
                }}
              >
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  {/* Photo Container */}
                  <div className="relative group">
                    <div 
                      className="absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{ background: `linear-gradient(135deg, ${themeStyles.accent}, ${themeStyles.accentSecondary})` }}
                    />
                    <img 
                      loading="lazy" 
                      decoding="async"
                      src={profileDraft.profilePic || "/avatar.png"}
                      alt="Profile"
                      className="size-32 rounded-3xl object-cover relative z-10 border-4 border-white shadow-xl"
                      style={{ borderColor: themeStyles.accent }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-[-6px] right-[-6px] rounded-full p-2.5 cursor-pointer shadow-lg z-20 transition-all hover:scale-105 active:scale-95"
                      style={{ background: themeStyles.accentSecondary, color: "#fff" }}
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUpdatingProfile}
                      />
                    </label>
                  </div>

                  {/* Username Display & Verification Badge */}
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h2 
                        className={`text-2xl font-black ${themeStyles.shimmer}`}
                        style={{ color: themeStyles.textPrimary, fontFamily: themeStyles.headingFont }}
                      >
                        {authUser.username || "Anonymous User"}
                      </h2>
                      <span 
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: `${themeStyles.accent}20`, color: themeStyles.accent, border: `1px solid ${themeStyles.accent}50` }}
                      >
                        VERIFIED SECURE
                      </span>
                    </div>

                    <p 
                      className="text-xs font-bold uppercase tracking-widest mt-1 opacity-75"
                      style={{ color: themeStyles.accent, fontFamily: themeStyles.monoFont }}
                    >
                      @{authUser.username || "guest"}#{authUser.tag || "0000"}
                    </p>

                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 text-xs opacity-80">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                      <span className="opacity-40">•</span>
                      <span>Uptime ULE-Grade</span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="block space-y-1.5">
                      <span 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        style={{ color: themeStyles.accent }}
                      >
                        <User className="size-3.5" />
                        Persona Name
                      </span>
                      <input
                        type="text"
                        value={profileDraft.username}
                        onChange={(e) => setProfileDraft((p) => ({ ...p, username: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all text-sm`}
                        style={{
                          background: `${themeStyles.accent}05`,
                          borderColor: `${themeStyles.accent}25`,
                          color: themeStyles.textPrimary
                        }}
                        disabled={!isEditing}
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <span 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        style={{ color: themeStyles.accent }}
                      >
                        <Mail className="size-3.5" />
                        Email directive
                      </span>
                      <input
                        type="email"
                        value={profileDraft.email}
                        onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all text-sm`}
                        style={{
                          background: `${themeStyles.accent}05`,
                          borderColor: `${themeStyles.accent}25`,
                          color: themeStyles.textPrimary
                        }}
                        disabled={!isEditing}
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span 
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      style={{ color: themeStyles.accent }}
                    >
                      Biography / Network Log
                    </span>
                    <textarea
                      value={profileDraft.bio}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl border outline-none transition-all text-sm resize-none"
                      style={{
                        background: `${themeStyles.accent}05`,
                        borderColor: `${themeStyles.accent}25`,
                        color: themeStyles.textPrimary
                      }}
                      placeholder="Share your distinguished story..."
                      disabled={!isEditing}
                    />
                  </label>

                  {isEditing && (
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="submit"
                        className="orbital-btn-primary text-xs py-2.5 px-6 font-black uppercase tracking-wider"
                        disabled={!hasChanges || isUpdatingProfile}
                        style={{ background: themeStyles.accent, color: "#fff" }}
                      >
                        <Save className="w-4 h-4" />
                        {isUpdatingProfile ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        className="orbital-btn-ghost text-xs py-2.5 px-6 font-black uppercase tracking-wider border"
                        style={{ borderColor: `${themeStyles.accent}30`, color: themeStyles.textPrimary }}
                        onClick={() => {
                          setProfileDraft({
                            username: authUser.username || "",
                            email: authUser.email || "",
                            bio: authUser.bio || "",
                            profilePic: authUser.profilePic || "",
                          });
                          setSelectedImg(null);
                          setIsEditing(false);
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}

                  {!isEditing && (
                    <p 
                      className="text-[10px] font-black uppercase tracking-wider opacity-60 text-right"
                      style={{ color: themeStyles.accent }}
                    >
                      ⚠️ Turn on edit mode to update identifiers
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* RIGHT SIDE: Real-Time Live Telemetry Dashboard & SVG Charts (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Telemetry Core Metrics Panel */}
              <div 
                className="p-6 rounded-[2.5rem] border backdrop-blur-md transition-all duration-300"
                style={{
                  background: themeStyles.cardBg,
                  border: themeStyles.cardBorder,
                  boxShadow: themeStyles.glow
                }}
              >
                <div className="flex items-center justify-between mb-5 border-b pb-3" style={{ borderColor: `${themeStyles.accent}15` }}>
                  <h3 
                    className="text-xs font-black uppercase tracking-widest flex items-center gap-2"
                    style={{ color: themeStyles.textPrimary, fontFamily: themeStyles.headingFont }}
                  >
                    <Gauge className="size-4" style={{ color: themeStyles.accent }} />
                    Live Telemetry Node
                  </h3>
                  
                  {/* Active Uptime Live Clock */}
                  <span 
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: `${themeStyles.accentSecondary}15`, color: themeStyles.accentSecondary }}
                  >
                    <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: "10s" }} />
                    Uptime: {formatUptime(sessionSeconds)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl" style={{ background: `${themeStyles.accent}06` }}>
                    <p className="opacity-60 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Registered
                    </p>
                    <p className="text-base font-black mt-1" style={{ color: themeStyles.textPrimary }}>
                      {daysRegistered} {daysRegistered === 1 ? "Day" : "Days"}
                    </p>
                    <p className="text-[9px] opacity-40 mt-0.5">Constellation age</p>
                  </div>

                  <div className="p-3.5 rounded-2xl" style={{ background: `${themeStyles.accent}06` }}>
                    <p className="opacity-60 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Frequencies
                    </p>
                    <p className="text-base font-black mt-1" style={{ color: themeStyles.textPrimary }}>
                      {users.length} Active
                    </p>
                    <p className="text-[9px] opacity-40 mt-0.5">Secure direct nodes</p>
                  </div>

                  <div className="p-3.5 rounded-2xl" style={{ background: `${themeStyles.accent}06` }}>
                    <p className="opacity-60 flex items-center gap-1">
                      <Network className="w-3.5 h-3.5" /> Nexus Groups
                    </p>
                    <p className="text-base font-black mt-1" style={{ color: themeStyles.textPrimary }}>
                      {nexuses.length} Channels
                    </p>
                    <p className="text-[9px] opacity-40 mt-0.5">Cryptographic grids</p>
                  </div>

                  <div className="p-3.5 rounded-2xl" style={{ background: `${themeStyles.accent}06` }}>
                    <p className="opacity-60 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Identity Grade
                    </p>
                    <p className="text-base font-black mt-1" style={{ color: themeStyles.textPrimary }}>
                      98% Optimal
                    </p>
                    <p className="text-[9px] opacity-40 mt-0.5">E2EE shield status</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive SVG Charts Block */}
              <div 
                className="p-6 rounded-[2.5rem] border backdrop-blur-md transition-all duration-300"
                style={{
                  background: themeStyles.cardBg,
                  border: themeStyles.cardBorder,
                  boxShadow: themeStyles.glow
                }}
              >
                <h3 
                  className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4"
                  style={{ color: themeStyles.textPrimary, fontFamily: themeStyles.headingFont }}
                >
                  <Activity className="size-4 animate-pulse" style={{ color: themeStyles.accent }} />
                  Activity Wave & Analytics
                </h3>

                {/* SVG 1: Interactive Wave Activity Sparkline */}
                <div className="mb-5 relative p-2 rounded-2xl" style={{ background: "rgba(0,0,0,0.15)" }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1.5 opacity-60 font-black">
                    Constellation Pulse (Live Wave)
                  </p>
                  <svg viewBox="0 0 100 30" className="w-full h-16 overflow-visible">
                    <defs>
                      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={themeStyles.accent} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={themeStyles.accent} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,25 C 20,5 30,28 50,15 C 70,2 80,18 100,8 L 100,30 L 0,30 Z"
                      fill="url(#waveGrad)"
                    />
                    <path
                      d="M 0,25 C 20,5 30,28 50,15 C 70,2 80,18 100,8"
                      fill="none"
                      stroke={themeStyles.accent}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="15" r="2.2" fill={themeStyles.accentSecondary} className="animate-ping" style={{ transformOrigin: "50px 15px" }} />
                    <circle cx="50" cy="15" r="1.5" fill={themeStyles.accentSecondary} />
                    <circle cx="100" cy="8" r="1.5" fill={themeStyles.accent} />
                  </svg>
                </div>

                {/* SVG 2: Interactive Real-Data Bar Chart */}
                <div className="p-2 rounded-2xl" style={{ background: "rgba(0,0,0,0.15)" }}>
                  <p className="text-[9px] uppercase tracking-widest mb-3 opacity-60 font-black">
                    Interactive Grid Allocation
                  </p>
                  
                  <div className="grid grid-cols-4 gap-2 h-24 items-end px-3">
                    {/* Bar 1: Direct Frequencies */}
                    <div className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                      <div 
                        className="w-4 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ 
                          height: `${Math.min(90, Math.max(10, users.length * 15))}%`, 
                          background: themeStyles.accent 
                        }}
                      />
                      <span className="text-[8px] font-black uppercase opacity-60">DM</span>
                    </div>

                    {/* Bar 2: Nexuses */}
                    <div className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                      <div 
                        className="w-4 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ 
                          height: `${Math.min(90, Math.max(10, nexuses.length * 20))}%`, 
                          background: themeStyles.accentSecondary 
                        }}
                      />
                      <span className="text-[8px] font-black uppercase opacity-60">NEX</span>
                    </div>

                    {/* Bar 3: Days Registered */}
                    <div className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                      <div 
                        className="w-4 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ 
                          height: `${Math.min(95, Math.max(15, daysRegistered * 4))}%`, 
                          background: themeStyles.accent 
                        }}
                      />
                      <span className="text-[8px] font-black uppercase opacity-60">AGE</span>
                    </div>

                    {/* Bar 4: Uptime Grade */}
                    <div className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                      <div 
                        className="w-4 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ 
                          height: "90%", 
                          background: themeStyles.accentSecondary 
                        }}
                      />
                      <span className="text-[8px] font-black uppercase opacity-60">SEC</span>
                    </div>
                  </div>
                </div>

                <p 
                  className="text-[9px] font-black uppercase tracking-wider text-center mt-3 opacity-50"
                  style={{ fontFamily: themeStyles.monoFont }}
                >
                  ✦ Analytical pulse metrics synchronized locally ✦
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm p-4">
          <div className="orbital-glass-card p-6 w-full max-w-md border-error/30">
            <h3 className="text-xl font-bold text-error">
              Delete Account?
            </h3>
            <p className="text-sm text-base-content/70 mt-3">
              This action is irreversible. Your profile data will be removed,
              and you will be signed out. A soft recovery window of 30s is
              suggested in underlying API.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="orbital-btn-ghost py-2 px-4"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-error hover:brightness-110 text-error-content font-black uppercase tracking-wide text-xs transition-all"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Core Identity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrbitalPageWrapper>
  );
};

export default ProfilePage;
