import { memo, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../../../../store/useNexusStore";
import { useChatStore } from "../../../../store/useChatStore";
import { PixelAvatarBadge } from "../../../avatar/PixelAvatar/PixelAvatarBadge.jsx";

const GamerSidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const { nexuses, isNexusesLoading, setSelectedNexus, nexusUnread, setNexusActionView } = useNexusStore();
    const { users, setSelectedUser } = useChatStore();
    const [hiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('gamer_hidden_nexuses') || '[]'));
    const [pinnedNexuses] = useState(() => JSON.parse(localStorage.getItem('gamer_pinned_nexuses') || '[]'));

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
        <aside className="gamer-sidebar">
            <div className="tab-control">
                <button className={activeTab === "orbits" ? "active orbits" : ""} onClick={() => setActiveTab("orbits")}># ORBITS</button>
                <button className={activeTab === "contacts" ? "active contacts" : ""} onClick={() => setActiveTab("contacts")}>👤 CONTACTS</button>
            </div>

            <div className="action-hub">
                <button className="join" onClick={() => setNexusActionView("join")}>JOIN</button>
                <button className="nexus" onClick={() => setNexusActionView("create")}>+ NEXUS</button>
            </div>

            <div className="sidebar-list custom-scrollbar">
                {activeTab === "orbits" ? (
                    sortedNexuses.map(n => (
                        <div key={n._id} className="sidebar-item" onClick={() => { setSelectedUser(null); setSelectedNexus(n); navigate(`/nexus/${n._id}`); }}>
                            <div className="item-inner">
                                <div className="avatar-mini">
                                    {n.avatar ? <img src={n.avatar} alt="" /> : <PixelAvatarBadge type="dog" size={36} showDot={false} />}
                                </div>
                                <div className="info">
                                    <div className="name">{n.name}</div>
                                    <div className="meta">{n.members?.length || 0} NODES // ONLINE</div>
                                </div>
                                {nexusUnread[n._id] > 0 && <div className="unread">{nexusUnread[n._id]}</div>}
                            </div>
                        </div>
                    ))
                ) : (
                    users.map(u => (
                        <div key={u._id} className="sidebar-item" onClick={() => { setSelectedNexus(null); setSelectedUser(u); navigate(`/chat/${u._id}`); }}>
                             <div className="item-inner">
                                <div className="avatar-mini">
                                    {u.profilePic ? <img src={u.profilePic} alt="" /> : <PixelAvatarBadge type="cat" size={34} showDot={false} />}
                                </div>
                                <div className="name">{u.username}</div>
                             </div>
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <div className="orbit-launch" onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))}>
                    <div className="whirl">🌀</div>
                    <div className="content">
                        <div className="title">LAUNCH_ORBIT</div>
                        <div className="subtitle">88 FPS ENGINE_ACTIVE</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default memo(GamerSidebar);
