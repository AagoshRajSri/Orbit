import React from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Megaphone, X, Info, AlertTriangle, AlertOctagon } from "lucide-react";

export default function GlobalAnnouncementBanner() {
  const { appConfig } = useAuthStore();
  const [dismissed, setDismissed] = React.useState(false);

  const announcement = appConfig?.globalAnnouncement;

  if (!announcement?.enabled || !announcement?.message || dismissed) return null;

  const getStyles = () => {
    switch (announcement.severity) {
      case "critical":
        return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: <AlertOctagon size={16} />, accent: "bg-red-500" };
      case "warning":
        return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: <AlertTriangle size={16} />, accent: "bg-amber-500" };
      default:
        return { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary", icon: <Megaphone size={16} />, accent: "bg-primary" };
    }
  };

  const styles = getStyles();

  return (
    <div className={`relative w-full ${styles.bg} border-b ${styles.border} backdrop-blur-md z-[60] py-2 px-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3 max-w-[90%]">
        <div className={`p-1.5 rounded-lg ${styles.bg} ${styles.text}`}>
          {styles.icon}
        </div>
        <p className={`text-sm font-medium ${styles.text} truncate`}>
          {announcement.message}
        </p>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white/60"
      >
        <X size={16} />
      </button>
    </div>
  );
}
