/**
 * Notification Item Component
 * Individual notification with auto-dismiss and theme-aware styling
 */

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useThemeStore } from "../store/useThemeStore";

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const NotificationItem = ({ notification }) => {
  const { removeNotification } = useNotificationStore();
  const { theme } = useThemeStore();
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = ICON_MAP[notification.type] || Info;

  const isPastel = theme === "pastel-dream";
  const isLight = theme === "light";

  // Dynamic Theme Colors
  const getThemeColors = () => {
    switch (notification.type) {
      case "success":
        if (isPastel) return { bg: "bg-[#ffdcf3]/90 border-[#ffaad0]/50", text: "text-[#d060a8]", icon: "text-[#e060b0]", progress: "bg-[#e060b0]" };
        if (isLight) return { bg: "bg-[#f0ebd8]/95 border-[#b08d57]/40", text: "text-[#5c4a2a]", icon: "text-[#b08d57]", progress: "bg-[#b08d57]" };
        return { bg: "bg-emerald-500/15 border-emerald-500/40", text: "text-emerald-300", icon: "text-emerald-400", progress: "bg-emerald-500" };
      case "error":
        if (isPastel) return { bg: "bg-red-100/90 border-red-300/50", text: "text-red-600", icon: "text-red-500", progress: "bg-red-400" };
        if (isLight) return { bg: "bg-red-50/95 border-red-300/40", text: "text-red-800", icon: "text-red-600", progress: "bg-red-500" };
        return { bg: "bg-red-500/15 border-red-500/40", text: "text-red-300", icon: "text-red-400", progress: "bg-red-500" };
      case "warning":
        if (isPastel) return { bg: "bg-orange-100/90 border-orange-300/50", text: "text-orange-600", icon: "text-orange-500", progress: "bg-orange-400" };
        if (isLight) return { bg: "bg-amber-50/95 border-amber-300/40", text: "text-amber-800", icon: "text-amber-600", progress: "bg-amber-500" };
        return { bg: "bg-yellow-500/15 border-yellow-500/40", text: "text-yellow-300", icon: "text-yellow-400", progress: "bg-yellow-500" };
      case "info":
      default:
        if (isPastel) return { bg: "bg-[#e0f2fe]/90 border-[#bae6fd]/50", text: "text-[#0284c7]", icon: "text-[#38bdf8]", progress: "bg-[#38bdf8]" };
        if (isLight) return { bg: "bg-[#f1f5f9]/95 border-[#cbd5e1]/40", text: "text-[#334155]", icon: "text-[#64748b]", progress: "bg-[#64748b]" };
        return { bg: "bg-blue-500/15 border-blue-500/40", text: "text-blue-300", icon: "text-blue-400", progress: "bg-blue-500" };
    }
  };

  const colors = getThemeColors();

  useEffect(() => {
    if (!notification.duration) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (notification.duration / 50);
        if (newProgress <= 0) clearInterval(interval);
        return Math.max(0, newProgress);
      });
    }, 50);

    const timer = setTimeout(() => {
      handleClose();
    }, notification.duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [notification.duration, notification.id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isExiting
          ? "opacity-0 translate-x-full scale-95"
          : "opacity-100 translate-x-0 scale-100"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border backdrop-blur-md px-4 py-3 shadow-lg ${colors.bg}`}
        style={isPastel ? { boxShadow: "0 8px 30px rgba(255,150,200,0.2)" } : isLight ? { boxShadow: "0 8px 30px rgba(176,141,87,0.15)" } : { boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
      >
        {/* Progress bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-opacity-20 ${isPastel || isLight ? 'bg-black/10' : 'bg-base-300/40'}`}>
          <div
            className={`h-full ${colors.progress} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 pr-8">
          <Icon className={`h-5 w-5 flex-shrink-0 ${colors.icon}`} />
          <p className={`text-sm font-bold tracking-wide ${colors.text} leading-relaxed`}>
            {notification.message}
          </p>
          <button
            onClick={handleClose}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-black/10 ${colors.text}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

