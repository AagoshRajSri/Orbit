import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import OrbitCard from "../common/OrbitCard";

export default function OrbitalSidebar() {
  const [activeTab, setActiveTab] = useState("orbits");
  const [activeOrbitId, setActiveOrbitId] = useState("FR6T9N");

  // Mock data for orbits
  const orbits = [
    { id: "FR6T9N", name: "Do Bhai Dono Tabaahi", members: 1 },
    { id: "P0B01T", name: "Two Brothers Both Destructive...", members: 1 },
  ];

  const contacts = [
    { id: "USR001", name: "Alex Chen", online: true },
    { id: "USR002", name: "Sam Rivera", online: false },
    { id: "USR003", name: "Jordan Park", online: true },
    { id: "USR004", name: "Casey Morgan", online: true },
  ];

  const items = activeTab === "orbits" ? orbits : contacts;
  const orbitCards = useMemo(() => items, [items]);

  return (
    <div className="w-[320px] h-full px-6 py-5">
      <div className="h-full rounded-[26px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_45px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-6 text-[12px] font-semibold text-white/70">
            <button
              type="button"
              className={[
                "relative pb-2 transition-colors",
                activeTab === "orbits" ? "text-white" : "hover:text-white/90",
              ].join(" ")}
              onClick={() => setActiveTab("orbits")}
            >
              ORBITS
              {activeTab === "orbits" && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
              )}
            </button>
            <button
              type="button"
              className={[
                "relative pb-2 transition-colors",
                activeTab === "contacts" ? "text-white" : "hover:text-white/90",
              ].join(" ")}
              onClick={() => setActiveTab("contacts")}
            >
              CONTACTS
              {activeTab === "contacts" && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="h-9 rounded-xl border border-cyan-200/25 bg-white/6 text-[12px] font-semibold text-white/80 hover:text-white hover:border-cyan-200/45 hover:shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-all"
            >
              Join
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="h-9 rounded-xl bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 text-[12px] font-bold text-white shadow-[0_0_22px_rgba(232,121,249,0.35)] hover:shadow-[0_0_30px_rgba(232,121,249,0.5)] transition-shadow"
            >
              + Nexus
            </motion.button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-4 px-5 pb-5 space-y-3 overflow-y-auto max-h-[calc(100%-124px)]">
          {activeTab === "orbits" ? (
            orbitCards.map((o) => (
              <OrbitCard
                key={o.id}
                title={o.name}
                membersText={`${o.members} members`}
                orbitId={o.id}
                active={activeOrbitId === o.id}
                onClick={() => setActiveOrbitId(o.id)}
              />
            ))
          ) : (
            <div className="text-xs text-white/60">
              Contacts coming next (kept for functionality parity).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
