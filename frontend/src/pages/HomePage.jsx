import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import { useBreakpoint, isMobileOrTablet } from "../lib/useBreakpoint";

import Sidebar from "../components/layout/Sidebar";
import NoChatSelected from "../components/common/NoChatSelected";
import { BottomNav, OrbitDrawer } from "../components/layout/BottomNav";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";

import OrbitalPageWrapper from "../components/layout/OrbitalPageWrapper";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const isCompact = isMobileOrTablet(bp);

  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const selectedConversationType = useChatStore((s) => s.selectedConversationType);
  const selectedNexusId = useNexusStore((s) => s.selectedNexusId);
  
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const setSelectedNexus = useNexusStore((s) => s.setSelectedNexus);

  const hasActiveChat = Boolean(selectedConversationId || selectedNexusId);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("nexus");

  const handleMobileBack = () => {
    setSelectedUser(null);
    setSelectedNexus(null);
    navigate("/chat");
  };

  const handleOpenSidebar = (tab = "nexus") => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  return (
    <OrbitalPageWrapper>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden', background: 'var(--bg, #050508)' }}>
        
        {/* DESKTOP LAYOUT (Not compact) */}
        {!isCompact && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            {/* Permanent Sidebar */}
            <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
              <Sidebar />
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--chat-bg)' }}>
              {selectedConversationId && selectedConversationType === "direct" ? (
                <UniversalChatContainer type="dm" />
              ) : selectedNexusId ? (
                <UniversalChatContainer type="nexus" />
              ) : (
                <NoChatSelected />
              )}
            </div>
          </div>
        )}

        {/* MOBILE/TABLET LAYOUT (Compact) */}
        {isCompact && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* If a chat is active, show the chat full screen */}
            {hasActiveChat ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--chat-bg)' }}>
                {selectedConversationType === "direct" && selectedConversationId ? (
                  <UniversalChatContainer type="dm" onMobileBack={handleMobileBack} onOpenSidebar={handleOpenSidebar} />
                ) : selectedNexusId ? (
                  <UniversalChatContainer type="nexus" onMobileBack={handleMobileBack} onOpenSidebar={handleOpenSidebar} />
                ) : null}
              </div>
            ) : (
              /* If no chat is active, show the sidebar full screen (or as the main view) */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: '80px', background: 'var(--surface)' }}>
                <Sidebar mobileInitialTab={drawerTab} />
              </div>
            )}

            {/* Drawer for when inside a chat and user clicks hamburger */}
            <OrbitDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left">
              <Sidebar mobileInitialTab={drawerTab} onMobileSelect={() => setDrawerOpen(false)} />
            </OrbitDrawer>

            {/* Bottom Nav (only visible when not in a chat on mobile) */}
            {!hasActiveChat && (
              <BottomNav 
                active="chat" 
                onNavigate={(tab) => {
                  if (tab === "home") navigate("/dreamland");
                  else if (tab === "settings") navigate("/settings");
                  else if (tab === "notifications") navigate("/notifications");
                  else if (tab === "nexus") { setDrawerTab("nexus"); }
                  else if (tab === "chat") { setDrawerTab("messages"); }
                }} 
              />
            )}
          </div>
        )}
      </div>
    </OrbitalPageWrapper>
  );
}
