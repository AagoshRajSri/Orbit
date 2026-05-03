import { Settings, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { useSoundManager } from "../../hooks/useSoundManager";

export default function OrbitalHeader() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { play } = useSoundManager();

  const handleLogout = async () => {
    play("click");
    await logout();
    navigate("/login");
  };
  return (
    <div className="relative w-full px-6 py-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.35)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="w-64" />

          {/* Center trapezoid logo */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div
                className="px-16 py-2.5 rounded-[999px] bg-white/6 border border-white/14 backdrop-blur-2xl"
                style={{
                  clipPath:
                    "polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)",
                }}
              >
                <div
                  className="absolute inset-[-2px] rounded-[999px] blur-[2px] opacity-70"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(34,211,238,0.45), rgba(232,121,249,0.45))",
                    clipPath:
                      "polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)",
                  }}
                />
                <div className="relative flex items-center justify-center">
                  <span className="text-sm font-semibold tracking-[0.5em] text-white/90">
                    ORBIT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right buttons */}
          <div className="w-64 flex items-center justify-end gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="px-3 py-1.5 rounded-xl border border-cyan-200/25 bg-white/6 text-[12px] text-white/80 hover:text-white hover:border-cyan-200/45 hover:shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-all flex items-center gap-2"
              onClick={() => {
                play("click");
                navigate("/settings");
              }}
            >
              <Settings className="size-4 text-cyan-100/80" />
              Settings
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="px-3 py-1.5 rounded-xl border border-cyan-200/25 bg-white/6 text-[12px] text-white/80 hover:text-white hover:border-cyan-200/45 hover:shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-all flex items-center gap-2"
              onClick={() => {
                play("click");
                navigate("/profile");
              }}
            >
              <User className="size-4 text-cyan-100/80" />
              Profile
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className="px-3 py-1.5 rounded-xl border border-cyan-200/25 bg-white/6 text-[12px] text-white/80 hover:text-white hover:border-fuchsia-200/45 hover:shadow-[0_0_18px_rgba(232,121,249,0.25)] transition-all flex items-center gap-2"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="size-4 text-fuchsia-100/80" />
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
