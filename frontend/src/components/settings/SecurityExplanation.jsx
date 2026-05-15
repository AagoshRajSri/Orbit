import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Zap, 
  Cpu, 
  RefreshCw, 
  Key, 
  ArrowRight, 
  CheckCircle2, 
  User,
  ShieldCheck,
  Binary,
  Fingerprint
} from "lucide-react";

const SecurityExplanation = ({ isDark = false }) => {
  const textColor = isDark ? "text-white" : "text-slate-900";
  const subTextColor = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-950/40" : "bg-white/60";
  const borderColor = isDark ? "border-white/5" : "border-slate-200";
  const accentColor = "text-emerald-500";
  const accentBg = "bg-emerald-500/10";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-16 py-8 px-4 lg:px-8 max-w-5xl mx-auto"
    >
      {/* ── Header Section ── */}
      <motion.div variants={itemVariants} className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="relative inline-flex items-center justify-center p-4 rounded-3xl bg-emerald-500/5 mb-4 group">
          <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <ShieldCheck className="size-10 text-emerald-500 relative z-10" />
        </div>
        <h2 className={`text-4xl lg:text-5xl font-black tracking-tight ${textColor} leading-tight`}>
          The Vault <span className="text-emerald-500">Infrastructure</span>
        </h2>
        <p className={`text-lg lg:text-xl font-medium leading-relaxed ${subTextColor}`}>
          Orbit is built on a zero-trust foundation. Every byte is sealed with mathematical certainty, ensuring absolute privacy from edge to edge.
        </p>
      </motion.div>

      {/* ── Protocol 1: X3DH Handshake ── */}
      <motion.section 
        variants={itemVariants}
        className={`group p-8 lg:p-12 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-2xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5`}
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
          <Binary className="size-64 -rotate-12" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/10">
              <Key className="size-3" /> Identity Sealed
            </div>
            <div className="space-y-4">
              <h3 className={`text-3xl font-bold ${textColor}`}>X3DH Handshake</h3>
              <p className={`${subTextColor} text-lg leading-relaxed font-medium`}>
                Before the first message ever leaves your device, Orbit performs an <span className="text-emerald-500 font-bold">Extended Triple Diffie-Hellman</span> exchange. 
                This establishes a shared master secret without ever transmitting a key over the wire.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                "Mutual Identity Verification",
                "Asynchronous Perfect Forward Secrecy",
                "Cryptographic Deniability"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold tracking-tight">
                  <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  </div>
                  <span className={textColor}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visualization: X3DH */}
          <div className={`relative h-64 lg:h-80 flex items-center justify-center rounded-3xl ${isDark ? "bg-white/5 border-white/10" : "bg-slate-900/5 border-slate-300"} border border-dashed`}>
            <div className="flex items-center justify-between w-full px-8 lg:px-16 relative z-10">
              {/* You */}
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="size-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-xl shadow-blue-500/5"
                >
                  <User className="size-8 text-blue-500" />
                </motion.div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>You</span>
              </div>

              {/* Connecting Line & Key Animation */}
              <div className="flex-1 relative mx-4 lg:mx-8">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                <motion.div
                  animate={{ 
                    left: ["0%", "100%", "0%"],
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-3"
                >
                  <div className="p-2 rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/40">
                    <Key className="size-4 text-white" />
                  </div>
                </motion.div>
                {/* Data Packets */}
                {[0, 1, 2].map((p) => (
                  <motion.div
                    key={p}
                    animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: p * 0.6, ease: "linear" }}
                    className="absolute top-1/2 -translate-y-1/2 size-1 bg-blue-400 rounded-full blur-[1px]"
                  />
                ))}
              </div>

              {/* Peer */}
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                   whileHover={{ scale: 1.1 }}
                   className="size-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-xl shadow-purple-500/5"
                >
                  <User className="size-8 text-purple-500" />
                </motion.div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Peer</span>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none" />
          </div>
        </div>
      </motion.section>

      {/* ── Protocol 2: Double Ratchet ── */}
      <motion.section 
        variants={itemVariants}
        className={`group p-8 lg:p-12 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-2xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5`}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visualization: Ratchet */}
          <div className={`order-2 lg:order-1 relative h-64 lg:h-80 flex flex-col items-center justify-center rounded-3xl ${isDark ? "bg-white/5 border-white/10" : "bg-slate-900/5 border-slate-300"} border border-dashed gap-6`}>
            <div className="relative w-48 lg:w-64">
               <AnimatePresence mode="popLayout">
                 {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -50, scale: 0.8 }}
                      animate={{ opacity: 1 - (i * 0.3), x: i * 20, scale: 1 - (i * 0.05), y: i * 15 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center px-6 gap-4 backdrop-blur-md shadow-lg shadow-emerald-500/5"
                    >
                      <RefreshCw className={`size-5 text-emerald-500 ${i === 0 ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-full bg-emerald-500/20 rounded-full overflow-hidden">
                           <motion.div 
                             animate={{ width: ["0%", "100%"] }}
                             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                             className="h-full bg-emerald-500/40" 
                           />
                        </div>
                        <div className="h-1.5 w-2/3 bg-emerald-500/10 rounded-full" />
                      </div>
                      <Lock className="size-4 text-emerald-500/60" />
                    </motion.div>
                 ))}
               </AnimatePresence>
            </div>
            <div className="mt-20 text-center">
               <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${accentColor} animate-pulse`}>Generating Fresh Keys...</div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/10">
              <RefreshCw className="size-3" /> Living Keys
            </div>
            <div className="space-y-4">
              <h3 className={`text-3xl font-bold ${textColor}`}>Double Ratchet Protocol</h3>
              <p className={`${subTextColor} text-lg leading-relaxed font-medium`}>
                Every single message triggers a cryptographic "ratchet" that derives a <span className="text-emerald-500 font-bold">unique, fresh key</span>. 
                Even if one key is compromised, all previous and future communications remain impenetrable.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                "Instant Self-Healing Security",
                "Future & Backward Secrecy",
                "Ephemeral Session Material"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold tracking-tight">
                  <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  </div>
                  <span className={textColor}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      {/* ── Protocol 3: PQ Hybrid ── */}
      <motion.section 
        variants={itemVariants}
        className={`group p-8 lg:p-12 rounded-[2.5rem] border ${borderColor} ${cardBg} backdrop-blur-2xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5`}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/10">
              <Cpu className="size-3" /> Quantum Resistance
            </div>
            <div className="space-y-4">
              <h3 className={`text-3xl font-bold ${textColor}`}>Post-Quantum Hybrid</h3>
              <p className={`${subTextColor} text-lg leading-relaxed font-medium`}>
                To defend against future quantum computers, Orbit implements <span className="text-blue-400 font-bold">Kyber ML-KEM</span>. 
                We wrap your data in multiple layers of defense that even the most powerful quantum machines cannot solve.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-colors hover:bg-emerald-500/10">
                <div className="text-[9px] font-black text-emerald-500 mb-2 opacity-60 tracking-widest uppercase">Classical</div>
                <div className={`text-xs font-bold ${textColor}`}>ECDH (P-256)</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 transition-colors hover:bg-blue-500/10">
                <div className="text-[9px] font-black text-blue-400 mb-2 tracking-widest uppercase">Quantum</div>
                <div className={`text-xs font-bold ${textColor}`}>Kyber-1024</div>
              </div>
            </div>
          </div>

          <div className="relative h-64 lg:h-80 flex items-center justify-center">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(16,185,129,0.1)", 
                  "0 0 60px rgba(59,130,246,0.2)", 
                  "0 0 20px rgba(16,185,129,0.1)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="size-32 rounded-3xl border border-emerald-500/30 flex items-center justify-center relative bg-emerald-500/5 group-hover:border-emerald-500/50 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-3xl" />
              <ShieldCheck className="size-12 text-emerald-500 relative z-10" />
              
              {/* Rotating Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-blue-400/20 rounded-full scale-150"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-emerald-400/10 rounded-full scale-[1.8]"
              />
              
              {/* Scanning Effect */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-emerald-500/40 z-20 shadow-[0_0_10px_rgba(16,185,129,1)]"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── Security Footer ── */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col items-center gap-4 pt-8"
      >
        <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           <Fingerprint className="size-6" />
           <Lock className="size-6" />
           <Shield className="size-6" />
           <Binary className="size-6" />
        </div>
        <div className={`${subTextColor} text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-sm`}>
          Orbital Security Standard v4.0.0-PROD <br/>
          <span className="text-emerald-500/60 mt-1 block">Zero-Knowledge Proofs & Zero-Trust Verification Active</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecurityExplanation;

