import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import OrbitLogo from "../common/OrbitLogo";

const ReusableNavbar = ({
  leftContent,
  centerContent,
  rightContent,
  className = "",
  showDefaultActions = true
}) => {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { theme } = useThemeStore();

  return (
    <nav className={`reusable-navbar ${className}`}>
      <div className="nav-left">
        {leftContent || (
          <div className="nav-logo-group" onClick={() => navigate("/")}>
            <OrbitLogo />
            <span className="nav-brand-text">ORBIT</span>
          </div>
        )}
      </div>

      <div className="nav-center">
        {centerContent}
      </div>

      <div className="nav-right">
        {rightContent || (showDefaultActions && (
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => navigate("/settings")}>
              Settings
            </button>
            <button className="nav-btn" onClick={() => navigate("/profile")}>
              Profile
            </button>
            <button className="nav-btn logout" onClick={logout}>
              Logout
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default memo(ReusableNavbar);
