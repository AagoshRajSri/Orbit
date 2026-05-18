import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { ArrowLeft, Edit3, Trash2, Camera, Shield, Zap } from "lucide-react";
import toast from "../lib/toast";

/* ─── MODULAR COMPONENTS ─────────────────────────────────────────────────── */

const GhostButton = ({ icon: Icon, children, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-semibold tracking-widest uppercase transition-all bg-transparent border border-solid rounded-md
      ${
        danger
          ? "text-red-500 border-red-200 hover:bg-red-50"
          : "text-slate-600 border-[#E5E1D3] hover:bg-[#F5F2EA]"
      }`}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {children}
  </button>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-[#FCFBF9] border border-[#E5E1D3] rounded-2xl p-8 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Label = ({ children }) => (
  <span className="block text-[9px] font-semibold tracking-widest text-[#A68A56] uppercase mb-2">
    {children}
  </span>
);

const RadialGauge = ({ value }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-6">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#E5E1D3"
          strokeWidth="14"
          fill="transparent"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#A68A56"
          strokeWidth="14"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-slate-800">{value}%</span>
        <span className="text-[9px] font-semibold tracking-widest text-[#A68A56] uppercase mt-1">
          Identity Grade
        </span>
      </div>
    </div>
  );
};

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile, deleteAccount } = useAuthStore();
  const { users } = useChatStore();
  const { nexuses } = useNexusStore();

  const [isEditing, setIsEditing] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Draft state for edits
  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    if (!authUser) return;
    setProfileDraft({
      username: authUser.username || "",
      email: authUser.email || "",
      bio: authUser.bio || "",
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

  // Session Uptime Timer
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

  const daysRegistered = useMemo(() => {
    if (!authUser || !authUser.createdAt) return 1;
    const start = new Date(authUser.createdAt);
    const diffTime = Math.abs(new Date() - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [authUser]);

  // Real Data Construction
  const userProfile = useMemo(() => {
    return {
      identityGrade: 98,
      engagementData: [
        { name: "MON", value: 20 },
        { name: "TUE", value: 65 },
        { name: "WED", value: 45 },
        { name: "THU", value: 80 },
        { name: "FRI", value: 50 },
        { name: "SAT", value: 90 },
        { name: "SUN", value: 75 },
      ],
      nexusMetrics: [
        { subject: "SEC", A: 120, fullMark: 150 },
        { subject: "AGE", A: daysRegistered * 2 + 50, fullMark: 150 },
        { subject: "DM", A: users.length * 10 + 40, fullMark: 150 },
        { subject: "NEX", A: nexuses.length * 15 + 60, fullMark: 150 },
      ],
      profileDetails: {
        username: authUser?.username || "Guest",
        tag: authUser?.orbitTag || "0000",
        email: authUser?.email || "unknown@directive.com",
        bio: authUser?.bio || "Executive architecture node initializing. Secure protocols active. Managing nexus group frequencies and local constellation pulses with 98% optimal precision.",
        profilePic: authUser?.profilePic || "/avatar.png",
      },
      stats: {
        daysActive: daysRegistered,
        activeFrequencies: users.length,
        nexusChannels: nexuses.length,
        shieldStatus: "Optimal",
      },
    };
  }, [authUser, users.length, nexuses.length, daysRegistered]);

  // Handlers
  const handleImageUpload = (e) => {
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

  const handleSave = async () => {
    if (!profileDraft.username.trim() || !profileDraft.email.trim()) {
      toast.error("Identifiers required.");
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
      toast.success("Identifiers updated.");
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Confirm deletion of Executive Node identity? This action is irreversible.")) {
      try {
        await deleteAccount();
        navigate("/signup");
      } catch (error) {
        toast.error("Deletion failed.");
      }
    }
  };

  if (!authUser) return null;

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#F5F2EA] font-sans text-slate-800 pb-12 selection:bg-[#A68A56] selection:text-white">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-10 bg-[#F5F2EA]/80 backdrop-blur-md border-b border-[#E5E1D3]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-sm font-semibold tracking-widest text-slate-600 uppercase hover:text-[#A68A56] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orbit
          </button>

          <div className="flex items-center gap-4">
            <GhostButton icon={Edit3} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "View Profile" : "Edit Profile"}
            </GhostButton>
            <GhostButton icon={Trash2} onClick={handleDelete} danger>
              Delete Identity
            </GhostButton>
          </div>
        </div>
      </header>

      {/* ── Main Grid Layout ── */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT PANE (7 Columns) ── */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Identity Card */}
            <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="relative group shrink-0">
                <img
                  src={profileDraft.profilePic || "/avatar.png"}
                  alt="Avatar"
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-[#E5E1D3] shadow-sm"
                />
                <label className="absolute -bottom-3 -right-3 p-2.5 bg-[#A68A56] text-white rounded-xl shadow-md cursor-pointer hover:bg-[#8e764a] transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left pt-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {userProfile.profileDetails.username}
                  </h1>
                  <span className="px-2.5 py-1 text-[9px] font-bold tracking-widest text-[#A68A56] uppercase border border-[#A68A56]/30 rounded-md bg-[#A68A56]/5">
                    Verified Secure
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mb-4">
                  @{userProfile.profileDetails.username}#{userProfile.profileDetails.tag}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                    Online
                  </div>
                  <div className="w-px h-4 bg-[#E5E1D3]"></div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#A68A56]" />
                    Uptime ULE-Grade
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Forms Card */}
            <Card>
              <form className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Persona Name</Label>
                    <input
                      type="text"
                      value={profileDraft.username}
                      onChange={(e) => setProfileDraft({ ...profileDraft, username: e.target.value })}
                      disabled={!isEditing}
                      className="w-full bg-[#F5F2EA] border border-[#E5E1D3] rounded-lg px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#A68A56] disabled:opacity-70 transition-colors"
                    />
                  </div>
                  <div>
                    <Label>Email Directive (Display Only)</Label>
                    <input
                      type="email"
                      value={profileDraft.email}
                      disabled={true}
                      className="w-full bg-[#E5E1D3]/30 border border-[#E5E1D3] rounded-lg px-4 py-3 text-sm font-medium text-slate-400 focus:outline-none cursor-not-allowed transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Biography / Network Log</Label>
                  <textarea
                    value={profileDraft.bio}
                    onChange={(e) => setProfileDraft({ ...profileDraft, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full bg-[#F5F2EA] border border-[#E5E1D3] rounded-lg px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#A68A56] disabled:opacity-70 resize-none transition-colors leading-relaxed"
                  />
                </div>

                {isEditing ? (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isUpdatingProfile}
                      className="px-6 py-2.5 bg-[#A68A56] hover:bg-[#8e764a] text-white text-[11px] font-bold tracking-widest uppercase rounded-lg transition-colors"
                    >
                      {isUpdatingProfile ? "Committing..." : "Commit Changes"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end pt-2 text-[#A68A56]/60">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold tracking-widest uppercase">
                      Turn on edit mode to update identifiers
                    </span>
                  </div>
                )}
              </form>
            </Card>

            {/* Engagement Stream Dynamics */}
            <Card className="flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Label>Activity Flow Velocity</Label>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">Synchronized State</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#A68A56]">PEAK: 92%</span>
                  <Label>Global Index</Label>
                </div>
              </div>
              
              <div className="w-full h-48 -mx-2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={userProfile.engagementData}>
                    <defs>
                      <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A68A56" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#A68A56" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#A68A56"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWave)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center mt-4 border-t border-[#E5E1D3] pt-4">
                <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                  Temporal Start
                </span>
                <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                  Active Horizon
                </span>
              </div>
            </Card>

          </div>

          {/* ── RIGHT SIDEBAR (5 Columns) ── */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* System Integrity */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold tracking-widest text-[11px] uppercase">
                  <Zap className="w-4 h-4 text-[#A68A56]" />
                  System Integrity
                </div>
                <div className="px-2 py-1 bg-[#F5F2EA] border border-[#E5E1D3] rounded text-[9px] font-mono font-semibold text-slate-500">
                  UPTIME: {formatUptime(sessionSeconds)}
                </div>
              </div>

              <RadialGauge value={userProfile.identityGrade} />

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-[#F5F2EA] p-4 rounded-xl border border-[#E5E1D3]">
                  <Label>Active Age</Label>
                  <span className="text-lg font-bold text-slate-800">
                    {userProfile.stats.daysActive} Days
                  </span>
                </div>
                <div className="bg-[#F5F2EA] p-4 rounded-xl border border-[#E5E1D3]">
                  <Label>Shield Status</Label>
                  <span className="text-lg font-bold text-[#A68A56]">
                    {userProfile.stats.shieldStatus}
                  </span>
                </div>
              </div>
            </Card>

            {/* Nexus Distribution */}
            <Card>
              <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold tracking-widest text-[11px] uppercase">
                <Shield className="w-4 h-4 text-[#A68A56]" />
                Nexus Distribution
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={userProfile.nexusMetrics}>
                    <PolarGrid stroke="#E5E1D3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                    <Radar
                      name="Metrics"
                      dataKey="A"
                      stroke="#A68A56"
                      fill="#A68A56"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Label>Cryptographic Grids</Label>
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                  12 Parallel
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-[#F5F2EA] rounded-full mt-2 mb-6 overflow-hidden">
                <div className="h-full bg-[#A68A56] rounded-full w-3/4"></div>
              </div>

              <div className="text-center">
                <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                  ✦ Network Harmonics Synchronized ✦
                </span>
              </div>
            </Card>

          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
          <p className="mb-2">Dynamic Performance & Activity Tracking Synchronized</p>
          <p>© 2024 Executive Precision Network Architecture</p>
        </footer>
      </main>
    </div>
  );
}
