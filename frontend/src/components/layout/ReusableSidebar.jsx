import { useEffect, useState, memo, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../../store/useNexusStore";
import { useChatStore } from "../../store/useChatStore";
import { PixelAvatarBadge } from "../avatar/PixelAvatar/PixelAvatarBadge.jsx";

const ReusableSidebar = ({
  activeTab,
  setActiveTab,
  onJoin,
  onNexus,
  className = "",
  renderCustomItem
}) => {
  const navigate = useNavigate();
  const {
    nexuses,
    isNexusesLoading,
    setSelectedNexus,
    nexusUnread,
    setNexusActionView
  } = useNexusStore();
  const { users, setSelectedUser } = useChatStore();

  const [pinnedNexuses, setPinnedNexuses] = useState(() => {
    return JSON.parse(localStorage.getItem('orbit_pinned_nexuses') || '[]');
  });

  const sortedNexuses = useMemo(() => {
    return [...nexuses].sort((a, b) => {
      const aPinned = pinnedNexuses.includes(a._id);
      const bPinned = pinnedNexuses.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [nexuses, pinnedNexuses]);

  return (
    <aside className={`reusable-sidebar ${className}`}>
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === "orbits" ? "active" : ""}`}
          onClick={() => setActiveTab("orbits")}
        >
          ORBITS
        </button>
        <button
          className={`tab-btn ${activeTab === "contacts" ? "active" : ""}`}
          onClick={() => setActiveTab("contacts")}
        >
          CONTACTS
        </button>
      </div>

      <div className="sidebar-actions">
        <button className="action-btn" onClick={onJoin || (() => setNexusActionView("join"))}>
          JOIN
        </button>
        <button className="action-btn primary" onClick={onNexus || (() => setNexusActionView("create"))}>
          CREATE
        </button>
      </div>

      <div className="sidebar-content custom-scrollbar">
        {activeTab === "orbits" ? (
          <div className="sidebar-list">
            {isNexusesLoading ? (
              <div className="loading-state">Syncing...</div>
            ) : nexuses.length === 0 ? (
              <div className="empty-state">No orbits found.</div>
            ) : (
              sortedNexuses.map(n => (
                <div
                  key={n._id}
                  className="sidebar-item"
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedNexus(n);
                    navigate(`/nexus/${n._id}`);
                  }}
                >
                  {renderCustomItem ? renderCustomItem(n, "nexus") : (
                    <div className="item-layout">
                       <div className="avatar-mini">
                          {n.avatar ? <img src={n.avatar} alt="" /> : <div className="avatar-placeholder">{n.name[0]}</div>}
                       </div>
                       <span className="item-name">{n.name}</span>
                       {nexusUnread[n._id] > 0 && <span className="unread-badge">{nexusUnread[n._id]}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="sidebar-list">
            {users.length === 0 ? (
              <div className="empty-state">No contacts found.</div>
            ) : (
              users.map(u => (
                <div
                  key={u._id}
                  className="sidebar-item"
                  onClick={() => {
                    setSelectedNexus(null);
                    setSelectedUser(u);
                    navigate(`/chat/${u._id}`);
                  }}
                >
                  {renderCustomItem ? renderCustomItem(u, "contact") : (
                    <div className="item-layout">
                       <div className="avatar-mini">
                          {u.profilePic ? <img src={u.profilePic} alt="" /> : <div className="avatar-placeholder">{u.username[0]}</div>}
                       </div>
                       <span className="item-name">{u.username}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default memo(ReusableSidebar);
