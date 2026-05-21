import { useState, useEffect } from "react";
import { Shield, Key, MapPin, Monitor, Smartphone, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { axiosInstance } from "../../lib/axios.jsx";
import toast from "../../lib/toast.js";

const SecurityLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/auth/security-logs");
      setLogs(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load security logs");
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (action, riskScore) => {
    if (riskScore > 50) return <AlertTriangle className="size-4 text-error" />;
    
    switch (action) {
      case "login":
      case "constellation_login":
      case "face_login":
        return <ShieldCheck className="size-4 text-success" />;
      case "password_change":
      case "passkey_registered":
        return <Key className="size-4 text-warning" />;
      case "logout":
        return <Monitor className="size-4 text-base-content/50" />;
      default:
        return <Shield className="size-4 text-info" />;
    }
  };

  const formatAction = (action) => {
    return action.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md overflow-hidden">
      <div className="p-5 border-b border-base-300/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="size-4 text-blue-400" />
            Security Activity Log
          </h3>
          <p className="text-xs text-base-content/65 mt-1">
            Recent security events on your account (last 30 days).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-sm text-base-content/65">
          No recent security events found.
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto divide-y divide-base-300/60">
          {logs.map((log) => (
            <div key={log._id} className="p-4 flex gap-4 hover:bg-base-200/30 transition-colors">
              <div className="mt-1">
                {getLogIcon(log.action, log.riskScore)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold truncate">
                    {formatAction(log.action)}
                  </span>
                  <span className="text-xs text-base-content/50 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-xs text-base-content/70 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {log.ip}
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="size-3" /> 
                    <span className="truncate max-w-[200px]">{log.userAgent}</span>
                  </span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-2 text-[10px] font-mono bg-base-300/30 p-2 rounded text-base-content/60 break-all">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityLogViewer;
