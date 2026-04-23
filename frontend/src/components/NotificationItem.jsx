/**
 * Notification Item Component
 * Individual notification with auto-dismiss and theme-aware styling
 */

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_CONFIG = {
  success: {
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-300",
    icon: "text-emerald-400",
    progress: "bg-emerald-500",
  },
  error: {
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-300",
    icon: "text-red-400",
    progress: "bg-red-500",
  },
  warning: {
    bg: "bg-yellow-500/10 border-yellow-500/30",
    text: "text-yellow-300",
    icon: "text-yellow-400",
    progress: "bg-yellow-500",
  },
  info: {
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-300",
    icon: "text-blue-400",
    progress: "bg-blue-500",
  },
};

export const NotificationItem = ({ notification }) => {
  const { removeNotification } = useNotificationStore();
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = ICON_MAP[notification.type] || Info;
  const colors = COLOR_CONFIG[notification.type] || COLOR_CONFIG.info;

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
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-base-300/20">
          <div
            className={`h-full ${colors.progress} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3 pr-8">
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
          <p className={`text-sm font-medium ${colors.text} leading-relaxed`}>
            {notification.message}
          </p>
          <button
            onClick={handleClose}
            className={`absolute right-2 top-2 p-1 rounded-lg transition-colors hover:bg-white/10 ${colors.text}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
