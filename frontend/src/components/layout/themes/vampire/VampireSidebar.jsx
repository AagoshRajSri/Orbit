import { memo, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../../../../store/useNexusStore";
import { useChatStore } from "../../../../store/useChatStore";
import { PixelAvatarBadge } from "../../../avatar/PixelAvatar/PixelAvatarBadge.jsx";

const VampireSidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const { nexuses, isNexusesLoading, setSelectedNexus, nexusUnread, setNexusActionView } = useNexusStore();
    const { users, setSelectedUser } = useChatStore();
    const [pinnedNexuses] = useState(() => JSON.parse(localStorage.getItem('vampire_pinned_nexuses') || '[]'));
    const [hiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('vampire_hidden_nexuses') || '[]'));

    const sortedNexuses = useMemo(() => {
        const hiddenIds = hiddenNexuses.map(h => h._id);
        return [...nexuses]
            .filter(n => !hiddenIds.includes(n._id))
            .sort((a, b) => {
                const aPinned = pinnedNexuses.includes(a._id);
                const bPinned = pinnedNexuses.includes(b._id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return 0;
            });
    }, [nexuses, pinnedNexuses, hiddenNexuses]);

    return (
        <aside className="vampire-sidebar">
            <div className="sidebar-tabs">
                <button className={`tab-btn ${activeTab === "orbits" ? "active" : ""}`} onClick={() => setActiveTab("orbits")}># ORBITS</button>
                <button className={`tab-btn ${activeTab === "contacts" ? "active" : ""}`} onClick={() => setActiveTab("contacts")}>👤 CONTACTS</button>
            </div>

            <div className="sidebar-actions">
                <button className="action-btn join" onClick={() => { setSelectedNexus(null); setSelectedUser(null); setNexusActionView("join"); }}># JOIN</button>
                <button className="action-btn nexus" onClick={() => { setSelectedNexus(null); setSelectedUser(null); setNexusActionView("create"); }}>+ NEXUS</button>
            </div>

            <div className="sidebar-list custom-scrollbar">
                {activeTab === "orbits" ? (
                    sortedNexuses.map(n => (
                        <div key={n._id} className="sidebar-item" onClick={() => { setSelectedUser(null); setSelectedNexus(n); navigate(`/nexus/${n._id}`); }}>
                            <div className="item-main">
                                <div className="avatar-wrap">
                                    {n.avatar ? <img src={n.avatar} alt="" /> : (
                                        <PixelAvatarBadge type="bat" size={34} showDot={false} />
                                    )}
                                </div>
                                <div className="item-info">
                                    <div className="name">{n.name}</div>
                                    <div className="meta">{n.members?.length || 0} members</div>
                                </div>
                                {nexusUnread[n._id] > 0 && <div className="unread">{nexusUnread[n._id]}</div>}
                            </div>
                        </div>
                    ))
                ) : (
                    users.map(u => (
                        <div key={u._id} className="sidebar-item" onClick={() => { setSelectedNexus(null); setSelectedUser(u); navigate(`/chat/${u._id}`); }}>
                            <div className="item-main">
                                <div className="avatar-wrap">
                                    {u.profilePic ? <img src={u.profilePic} alt="" /> : <div className="placeholder">{u.username[0]}</div>}
                                </div>
                                <div className="name">{u.username}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="sidebar-footer">
                <div className="enter-orbit-card disabled">
                    <div className="orbit-icon">🌑</div>
                    <div className="labels">
                        <div className="label">Enter Your Orbit</div>
                        <div className="sub">60 FPS Galaxy Engine</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default memo(VampireSidebar);
