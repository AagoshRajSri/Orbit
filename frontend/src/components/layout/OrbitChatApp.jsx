import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useSoundManager } from "../hooks/useSoundManager";
import {
  MessageSquare,
  Video,
  Mic,
  Share2,
  Compass,
  Settings,
  Bell,
  Search,
  X,
  Camera,
  UserPlus,
  Hash,
  Trash2,
  Info,
  ExternalLink,
  Star,
  Gamepad2,
  Briefcase,
} from "lucide-react";
import "./OrbitChatApp.css";
import { getSocket } from "../lib/socket";
import GalaxyBackground from "./GalaxyBackground";
import { useThemeStore } from "../store/useThemeStore";

const MOCK_USER = {
  id: "u1",
  name: "Aagosh",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aagosh&backgroundColor=6366f1",
  status: "online",
};

const ORBIT_BEHAVIOR_STORAGE_KEY = "orbit_behavior_v2";
const DEFAULT_ORBIT_BEHAVIOR = {
  showRings: true,
  autoPauseOnHover: true,
  interactionFilter: "all",
  theme: "nebula",
  audioEnabled: true,
};

const ORBIT_RINGS = [
  {
    radius: 130,
    duration: 45,
    contacts: [
      { id: "c1", name: "Bro", status: "online", angle: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bro&backgroundColor=10b981", since: "2024", shared: 12, channels: ["Design Club"] },
      { id: "c2", name: "Alice", status: "offline", angle: 180, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice&backgroundColor=f43f5e", since: "2023", shared: 5, channels: ["Work Orbit"] },
    ],
  },
  {
    radius: 240,
    duration: 70,
    contacts: [
      { id: "c3", name: "Charlie", status: "online", angle: 45, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=0ea5e9", since: "2025", shared: 42, channels: ["Work Orbit", "Gaming"] },
      { id: "c4", name: "David", status: "online", angle: 165, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=eab308", since: "2024", shared: 8, channels: ["Gaming", "Design Club"] },
      { id: "c5", name: "Eve", status: "offline", angle: 285, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve&backgroundColor=a855f7", since: "2022", shared: 104, channels: ["Work Orbit"] },
    ],
  },
  {
    radius: 360,
    duration: 100,
    contacts: [
      { id: "c6", name: "Frank", status: "online", angle: 90, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank&backgroundColor=14b8a6", since: "2024", shared: 3, channels: ["Design Club"] },
      { id: "c7", name: "Grace", status: "online", angle: 210, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&backgroundColor=fb923c", since: "2025", shared: 1, channels: ["Gaming"] },
      { id: "c8", name: "Heidi", status: "offline", angle: 330, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Heidi&backgroundColor=64748b", since: "2023", shared: 22, channels: ["Work Orbit", "Gaming"] },
    ],
  },
];

export default function OrbitChatApp({ onClose }) {
  const { play } = useSoundManager();
  const { theme } = useThemeStore();
  const appRef = useRef(null);
  const orbitSystemRef = useRef(null);
  const ringTweensRef = useRef([]);
  const [activeChannel, setActiveChannel] = useState("Primary Gravity");
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [orbitBehavior, setOrbitBehavior] = useState(DEFAULT_ORBIT_BEHAVIOR);
  const [notifications, setNotifications] = useState([
    { id: "n1", title: "Bro joined Work Orbit", message: "Bro is now in Work Orbit.", timestamp: Date.now() - 360000, read: false, target: "Work Orbit" },
  ]);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const navigate = useNavigate();

  const colors = useMemo(() => {
    const palette = {
      "amoled-dark": { ring: "rgba(78, 205, 196, 0.2)", halo: "#c6a06e", core: "#000", glow: "#4ecdc4" },
      "pastel-dream": { ring: "rgba(255, 170, 216, 0.4)", halo: "#c896ff", core: "#fff", glow: "#ffaad8" },
      "gamer-high-energy": { ring: "rgba(74, 222, 128, 0.3)", halo: "#ec4899", core: "#111", glow: "#4ade80" },
      default: { ring: "rgba(99, 102, 241, 0.2)", halo: "#8b5cf6", core: "#1e1b4b", glow: "#6366f1" }
    };
    return palette[theme] || palette.default;
  }, [theme]);

  const handleSound = useCallback((type) => {
    if (orbitBehavior.audioEnabled) play(type);
  }, [orbitBehavior.audioEnabled, play]);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const q = gsap.utils.selector(appRef);
      
      // Master Entry Timeline
      gsap.timeline()
        .from(q(".orbit-center-core"), { scale: 0, opacity: 0, duration: 1.4, ease: "back.out(2)" })
        .from(q(".orbit-ring-container"), { scale: 0.8, opacity: 0, duration: 1.6, stagger: 0.15, ease: "power4.out" }, "-=1")
        .from(q(".contact-node"), { scale: 0, opacity: 0, duration: 1, stagger: 0.04, ease: "back.out(1.5)" }, "-=1.2")
        .from(q(".orbit-sidebar"), { x: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.8");

      // Continuous Rotations
      ORBIT_RINGS.forEach((ring, i) => {
        const ringEl = q(`#orbit-ring-${i}`);
        const nodeEls = q(`.contact-anchor-${i}`);

        const rt = gsap.to(ringEl, { rotation: 360, duration: ring.duration, repeat: -1, ease: "none" });
        const nt = gsap.to(nodeEls, { rotation: -360, duration: ring.duration, repeat: -1, ease: "none" });
        
        ringTweensRef.current[i] = [rt, nt];
      });

      // Subtle Breathing
      gsap.to(q(".orbit-center-core"), {
        scale: 1.05,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, appRef);

    return () => ctx.revert();
  }, []);

  const handleNodeHover = (e, contactId, rIdx, isHovering) => {
    if (isHovering) {
      setHoveredNodeId(contactId);
      handleSound("hover");
      
      if (orbitBehavior.autoPauseOnHover && ringTweensRef.current[rIdx]) {
        ringTweensRef.current[rIdx].forEach(t => gsap.to(t, { timeScale: 0.05, duration: 1, ease: "power2.out" }));
      }
      
      gsap.to(".orbit-ring-container", { opacity: 0.3, duration: 0.6 });
      gsap.to(`#orbit-ring-${rIdx}`, { opacity: 1, duration: 0.4 });
      gsap.to(e.currentTarget, { scale: 1.15, duration: 0.5, ease: "elastic.out(1, 0.6)" });
    } else {
      setHoveredNodeId(null);
      if (orbitBehavior.autoPauseOnHover && ringTweensRef.current[rIdx]) {
        ringTweensRef.current[rIdx].forEach(t => gsap.to(t, { timeScale: 1, duration: 1.2, ease: "sine.inOut" }));
      }
      gsap.to(".orbit-ring-container", { opacity: 1, duration: 0.6 });
      gsap.to(e.currentTarget, { scale: 1, duration: 0.4, ease: "power2.out" });
    }
  };

  const handleNodeClick = (contact) => {
    setActiveContact(contact);
    handleSound("click");
    
    // Identity focus animation
    gsap.to(".orbit-system-wrapper", {
      z: 200,
      duration: 1.2,
      ease: "power3.inOut"
    });
  };

  const closeContactOverlay = () => {
    setActiveContact(null);
    gsap.to(".orbit-system-wrapper", {
      z: 0,
      duration: 1,
      ease: "power3.out"
    });
  };

  return (
    <div className="orbit-container-bg text-white font-sans" ref={appRef}>
      <GalaxyBackground />

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-[100] flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all font-semibold tracking-wider text-xs uppercase"
        >
          <X className="w-4 h-4" /> Exit Orbit
        </button>
      )}

      <div className="orbit-system-wrapper" ref={orbitSystemRef}>
        {ORBIT_RINGS.map((ring, rIdx) => {
          const size = ring.radius * 2;
          return (
            <div
              key={`ring-${rIdx}`}
              id={`orbit-ring-${rIdx}`}
              className="orbit-ring-container"
              style={{
                width: size,
                height: size,
                marginLeft: -ring.radius,
                marginTop: -ring.radius,
                borderColor: colors.ring,
              }}
            >
              {ring.contacts.map((contact) => {
                const isVisible = activeChannel === "Primary Gravity" || contact.channels.includes(activeChannel);
                
                return (
                  <div
                    key={contact.id}
                    className="contact-node-anchor"
                    style={{ transform: `rotate(${contact.angle}deg)` }}
                  >
                    <div
                      className="constellation-line"
                      style={{
                        height: ring.radius,
                        background: `linear-gradient(to top, transparent 0%, ${colors.glow}44 50%, ${colors.glow} 100%)`,
                        opacity: hoveredNodeId === contact.id && isVisible ? 1 : 0,
                      }}
                    />

                    <div
                      className="contact-node"
                      style={{ transform: `translateY(-${ring.radius}px)` }}
                      onMouseEnter={(e) => handleNodeHover(e, contact.id, rIdx, true)}
                      onMouseLeave={(e) => handleNodeHover(e, contact.id, rIdx, false)}
                      onClick={() => handleNodeClick(contact)}
                    >
                      <div className={`w-full h-full transition-all duration-700 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"}`}>
                        <div className={`w-full h-full contact-anchor-${rIdx}`}>
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className={`contact-avatar-img ${contact.status === "online" ? "status-glow-online" : "status-glow-offline"}`}
                          />
                          
                          <div className="node-tooltip">
                            <div className="flex items-center gap-4 mb-4">
                              <img src={contact.avatar} className="w-12 h-12 rounded-full ring-2 ring-indigo-500/50" />
                              <div>
                                <h4 className="font-bold text-lg leading-none">{contact.name}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${contact.status === 'online' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  ● {contact.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                              <div>
                                <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Established</p>
                                <p className="text-sm font-semibold">{contact.since}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Commonality</p>
                                <p className="text-sm font-semibold">{contact.shared} Nodes</p>
                              </div>
                            </div>

                            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
                              <MessageSquare className="w-3.5 h-3.5" /> Initiate Pulse
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div 
          className="orbit-center-core" 
          style={{ background: `radial-gradient(circle, ${colors.glow} 0%, ${colors.core} 100%)`, boxShadow: `0 0 60px ${colors.glow}44` }}
        >
          <div className="core-halo" style={{ borderColor: `${colors.halo}44` }} />
          <div className="w-20 h-20 rounded-full border-2 overflow-hidden bg-slate-900 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <img src={MOCK_USER.avatar} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 rounded-full animate-ping border border-indigo-500/30 opacity-20" />
        </div>
      </div>

      <aside className="orbit-sidebar">
        {[
          { icon: MessageSquare, id: "Primary Gravity" },
          { icon: Compass, id: "Network Explor" },
          { icon: Star, id: "Design Club" },
          { icon: Briefcase, id: "Work Orbit" },
          { icon: Gamepad2, id: "Gaming" },
          { icon: Settings, id: "Config" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveChannel(item.id); handleSound("click"); }}
            className={`orbit-sidebar-icon ${activeChannel === item.id ? "active" : ""}`}
            title={item.id}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </aside>

      {/* Identity Detail Overlay */}
      {activeContact && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
           <div className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="relative h-48 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden">
                 <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                    <img src={activeContact.avatar} className="w-full h-full object-cover blur-3xl scale-150" />
                 </div>
                 <button onClick={closeContactOverlay} className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="relative px-8 pb-10 -mt-16">
                 <div className="w-32 h-32 rounded-[2rem] border-[6px] border-[#0f172a] overflow-hidden shadow-2xl bg-[#0f172a]">
                    <img src={activeContact.avatar} className="w-full h-full object-cover" />
                 </div>
                 
                 <div className="mt-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <h2 className="text-3xl font-black text-white">{activeContact.name}</h2>
                          <p className="text-slate-400 font-medium mt-1">Stellar Node Index: {activeContact.id}</p>
                       </div>
                       <div className="flex gap-2">
                          <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                             <Share2 className="w-5 h-5" />
                          </button>
                          <button className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 transition-all shadow-lg shadow-indigo-600/40">
                             <MessageSquare className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-8">
                       {[
                         { label: "Stability", value: "98.4%", color: "text-emerald-400" },
                         { label: "Sync Rank", value: "#142", color: "text-indigo-400" },
                         { label: "Gravity", value: activeContact.shared, color: "text-rose-400" }
                       ].map(stat => (
                         <div key={stat.label} className="bg-white/5 border border-white/5 p-4 rounded-3xl">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* Create Orbit Modal */}
      {isCreateChannelModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
          <div className="bg-base-100 w-full max-w-sm rounded-[24px] p-6 flex flex-col items-stretch relative animate-in zoom-in-95 duration-200 shadow-2xl border border-base-content/10">
            <button
              onClick={() => setIsCreateChannelModalOpen(false)}
              className="absolute top-4 right-4 text-base-content/50 hover:text-base-content transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-6 text-primary">
              <div className="p-2 bg-primary/10 rounded-full">
                <Hash className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-base-content">
                Forge Orbit
              </h2>
            </div>

            <div className="form-control mb-4">
              <label className="label cursor-pointer shadow-none py-1">
                <span className="label-text font-semibold text-base-content/70 text-xs uppercase tracking-wide">
                  Orbit Designation
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Design Club, Project V..."
                className="input input-bordered bg-base-200 focus:outline-none focus:border-primary w-full"
              />
            </div>

            <button
              onClick={() => setIsCreateChannelModalOpen(false)}
              className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/30"
            >
              Initialize Orbit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
