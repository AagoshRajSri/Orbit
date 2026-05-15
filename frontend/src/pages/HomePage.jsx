import { useEffect, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore as useChat } from "../store/useChatStore";

import Sidebar from "../components/layout/Sidebar";
import NoChatSelected from "../components/common/NoChatSelected";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import MobileSidebarDrawer from "../components/layout/MobileSidebarDrawer";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";

import OrbitalPageWrapper from "../components/layout/OrbitalPageWrapper";

const HomePage = () => {
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const selectedConversationType = useChatStore((s) => s.selectedConversationType);
  const selectedNexusId = useNexusStore((s) => s.selectedNexusId);
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const setSelectedNexus = useNexusStore((s) => s.setSelectedNexus);

  const hasActiveChat = Boolean(selectedConversationId || selectedNexusId);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("nexus");

  const [isLgUp, setIsLgUp] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia?.("(min-width: 768px)");
    if (!mql) return;
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // Open sidebar drawer for a specific tab (called from bottom nav)
  const handleOpenSidebar = useCallback((tab = "nexus") => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  }, []);

  // Back from mobile chat → clear selection
  const handleMobileBack = useCallback(() => {
    setSelectedUser(null);
    setSelectedNexus(null);
  }, [setSelectedUser, setSelectedNexus]);

  return (
    <OrbitalPageWrapper>
      <div className="h-full min-h-0 min-w-0 overflow-hidden relative flex flex-col">

        {/* ── DESKTOP/TABLET layout (md+) — always visible ── */}
        {(!hasActiveChat || isLgUp) && (
          <div className="flex-1 flex items-stretch min-h-0 min-w-0 px-2 lg:px-4 py-4 overflow-hidden">
            <div className="orbital-glass-lg w-full h-full min-h-0 min-w-0 shadow-xl flex flex-col">
              <div className="flex-1 flex min-h-0">
                {/* Sidebar — always shown on desktop */}
                <Sidebar />

                {/* Chat panel or empty state */}
                {selectedConversationId && selectedConversationType === "direct" && (
                  <div className="hidden md:flex flex-1 min-h-0 min-w-0 flex-col">
                    <UniversalChatContainer type="dm" />
                  </div>
                )}
                {selectedNexusId && (
                  <div className="hidden md:flex flex-1 min-h-0 min-w-0 flex-col">
                    <UniversalChatContainer type="nexus" />
                  </div>
                )}
                {!selectedConversationId && !selectedNexusId && <NoChatSelected />}
              </div>
            </div>
          </div>
        )}

        {/* ── MOBILE: Welcome screen when no chat active (<md) ── */}
        {!hasActiveChat && !isLgUp && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <NoChatSelected />
          </div>
        )}

        {/* ── MOBILE full-screen chat overlay (<md) ── */}
        {hasActiveChat && !isLgUp && (
          <div className="mobile-chat-fullscreen bg-base-300 animate-slide-up">
            <div className="h-full w-full orbital-glass-lg flex flex-col overflow-hidden">
              {selectedConversationType === "direct" && selectedConversationId && (
                <UniversalChatContainer type="dm" onMobileBack={handleMobileBack} onOpenSidebar={handleOpenSidebar} />
              )}
              {selectedNexusId && (
                <UniversalChatContainer type="nexus" onMobileBack={handleMobileBack} onOpenSidebar={handleOpenSidebar} />
              )}
            </div>
          </div>
        )}

        {/* ── MOBILE: Sidebar Drawer ── */}
        {!isLgUp && (
          <MobileSidebarDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            initialTab={drawerTab}
          />
        )}

        {/* ── MOBILE: Bottom Navigation ── */}
        {!hasActiveChat && !isLgUp && (
          <MobileBottomNav onOpenSidebar={handleOpenSidebar} />
        )}
      </div>
    </OrbitalPageWrapper>
  );
};

export default HomePage;
