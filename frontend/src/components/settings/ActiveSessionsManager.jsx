import { useState, useEffect } from "react";
import { Monitor, Smartphone, Trash2, ShieldAlert } from "lucide-react";
import { axiosInstance } from "../../lib/axios.jsx";
import toast from "../../lib/toast.js";

const ActiveSessionsManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/auth/sessions");
      setSessions(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      setRevoking(sessionId);
      await axiosInstance.delete(`/auth/sessions/${sessionId}`);
      toast.success("Session revoked successfully");
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (userAgent && userAgent.toLowerCase().includes("mobile")) {
      return <Smartphone className="size-5 text-indigo-400" />;
    }
    return <Monitor className="size-5 text-blue-400" />;
  };

  const getDeviceName = (userAgent) => {
    if (!userAgent) return "Unknown Device";
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    
    if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    else if (userAgent.includes("OrbitApp")) browser = "Orbit Desktop";

    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone")) os = "iOS";

    return `${os} • ${browser}`;
  };

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md overflow-hidden">
      <div className="p-5 border-b border-base-300/60">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="size-4 text-emerald-400" />
          Active Sessions
        </h3>
        <p className="text-xs text-base-content/65 mt-1">
          You're currently logged in on these devices. Revoke any sessions that you don't recognize.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-8 text-center text-sm text-base-content/65">
          No active sessions found.
        </div>
      ) : (
        <div className="divide-y divide-base-300/60">
          {sessions.map((session, index) => {
            const isCurrentSession = index === 0; // The most recently active is likely current, or we'd ideally match the token
            return (
              <div key={session._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200/50 rounded-xl shadow-inner border border-base-300/30">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {getDeviceName(session.userAgent)}
                      {isCurrentSession && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-base-content/65 mt-1 flex gap-2">
                      <span>IP: {session.ipAddress}</span>
                      <span>•</span>
                      <span>{new Date(session.lastActive).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>

                {!isCurrentSession && (
                  <button
                    onClick={() => revokeSession(session._id)}
                    disabled={revoking === session._id}
                    className="btn btn-outline btn-error btn-sm w-full sm:w-auto"
                  >
                    {revoking === session._id ? (
                      <span className="loading loading-spinner size-4"></span>
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveSessionsManager;
