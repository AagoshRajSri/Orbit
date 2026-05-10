import { memo } from "react";
import { useThemeStore } from "../../store/useThemeStore";
import OrbitalPageWrapper from "./OrbitalPageWrapper";
import "./CommonUnifiedLayout.css";
import { useNexusStore } from "../../store/useNexusStore";
import { useChatStore } from "../../store/useChatStore";
import NexusActionOverlay from "../nexus/NexusActionOverlay";
import UniversalChatContainer from "../chat/UniversalChatContainer";

/**
 * CommonUnifiedLayout - Centralized layout logic for all themes.
 * Prevents UI duplication by providing a single structure where themes
 * only inject their unique visual components (Navbar, Sidebar, BackgroundEffects).
 */
const CommonUnifiedLayout = ({
  children,
  Navbar,
  Sidebar,
  BackgroundEffects,
  className = ""
}) => {
  const { nexusActionView, setNexusActionView, selectedNexus, selectedNexusId } = useNexusStore();
  const { selectedUser } = useChatStore();

  const isChatActive = Boolean(selectedNexus || selectedNexusId || selectedUser);

  return (
    <OrbitalPageWrapper className={className}>
      {/* 1. Theme-Specific Background Effects (Stars, Bats, Clouds, etc.) */}
      {BackgroundEffects && <BackgroundEffects />}

      {/* 2. Centralized Navbar */}
      {Navbar && Navbar}

      <div className={`layout-body-wrapper ${isChatActive ? 'chat-active' : 'chat-inactive'}`}>
        {/* 3. Centralized Sidebar */}
        {Sidebar && Sidebar}

        {/* 4. Content Area - Handles Chat routing automatically */}
        <main className="layout-main-content">
          {children ? (
            /* Explicit Page Content (Settings, Profile, etc.) */
            <div className="page-content-scrollable">
              {children}
            </div>
          ) : nexusActionView ? (
            /* Nexus Creation/Joining Overlays */
            <div className="absolute-overlay-full">
              <NexusActionOverlay
                mode={nexusActionView}
                onClose={() => setNexusActionView(null)}
                inline={true}
              />
            </div>
          ) : isChatActive ? (
            /* Automated Chat Container Injection */
            <div className="chat-interface-wrapper">
              <UniversalChatContainer
                key={selectedNexus?._id || selectedNexusId || selectedUser?._id}
                type={selectedUser ? "dm" : "nexus"}
              />
            </div>
          ) : (
            /* Default Empty State / Home Dashboard is handled by theme-specific children if provided,
               otherwise this would be the place for a fallback Welcome screen. */
            null
          )}
        </main>
      </div>
    </OrbitalPageWrapper>
  );
};

export default memo(CommonUnifiedLayout);
