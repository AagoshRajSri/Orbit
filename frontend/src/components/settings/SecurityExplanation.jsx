import React from "react";
import { ShieldCheck, Lock, Binary } from "lucide-react";

const SecurityExplanation = ({ isDark = false }) => {
  const textColor = isDark ? "text-white" : "text-slate-900";
  const subTextColor = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-950/40" : "bg-white/60";
  const borderColor = isDark ? "border-white/5" : "border-slate-200";

  return (
    <div className={`p-8 rounded-[2rem] border ${borderColor} ${cardBg} backdrop-blur-2xl`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <ShieldCheck className="size-12 text-emerald-500" />
        <h3 className={`text-2xl font-bold ${textColor}`}>Orbital Security Standard v4.0.0-PROD</h3>
        <p className={`${subTextColor} max-w-md`}>
          Orbit is built on a zero-trust foundation. Every byte is sealed with mathematical certainty, ensuring absolute privacy from edge to edge.
        </p>
        <div className="flex gap-4 mt-4 pt-4 border-t border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
            <Lock className="size-4" /> E2E Encrypted
          </div>
          <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
            <Binary className="size-4" /> Quantum Resistant
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityExplanation;

