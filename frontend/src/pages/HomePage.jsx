import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";

import OrbitalPageWrapper from "../components/OrbitalPageWrapper";
import { Compass } from "lucide-react";

const HomePage = () => {
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const selectedConversationType = useChatStore((s) => s.selectedConversationType);
  const selectedNexusId = useNexusStore((s) => s.selectedNexusId);
  const hasActiveChat = Boolean(selectedConversationId || selectedNexusId);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isLgUp, setIsLgUp] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia?.("(min-width: 768px)");
    if (!mql) return;
    const onChange = () => setIsLgUp(mql.matches);
    onChange();
    // Safari fallback
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (hasActiveChat) {
      setOverlayOpen(false);
      requestAnimationFrame(() => setOverlayOpen(true));
    } else {
      setOverlayOpen(false);
    }
  }, [hasActiveChat]);

  return (
    <OrbitalPageWrapper>
      <div className="h-full min-h-0 min-w-0 overflow-hidden relative flex flex-col">
        {/* Desktop/tablet layout (keeps sidebar) */}
        {(!hasActiveChat || isLgUp) && (
          <div className="flex-1 flex items-stretch min-h-0 min-w-0 px-2 lg:px-4 py-4 overflow-hidden">
            <div className="orbital-glass-lg w-full h-full min-h-0 min-w-0 shadow-xl flex flex-col">
              <div className="flex-1 flex min-h-0">
                <Sidebar />

                {!selectedConversationId && !selectedNexusId ? (
                  <NoChatSelected />
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Mobile full-screen chat overlay */}
        {hasActiveChat && !isLgUp && (
          <div className="fixed inset-x-0 top-12 bottom-0 z-50 flex flex-col bg-base-300">
            <div className="h-full w-full orbital-glass-lg flex flex-col">
              <div
                className={`flex-1 min-h-0 transition-all duration-300 ease-out ${
                  overlayOpen
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-2 scale-[0.98]"
                } flex flex-col`}
              >
                {/* Removed chat UI containers per instruction */}
              </div>
            </div>
          </div>
        )}
      </div>
    </OrbitalPageWrapper>
  );
};
export default HomePage;
