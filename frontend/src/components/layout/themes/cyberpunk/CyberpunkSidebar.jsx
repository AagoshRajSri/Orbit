import { memo, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../../../../store/useNexusStore";
import { useChatStore } from "../../../../store/useChatStore";
import { useSoundManager } from "../../../../hooks/useSoundManager";
import { PixelAvatarBadge } from "../../../avatar/PixelAvatar/PixelAvatarBadge.jsx";

const CyberpunkSidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const { play } = useSoundManager();
    const { nexuses, isNexusesLoading, setSelectedNexus, nexusUnread, setNexusActionView } = useNexusStore();
    const { users, setSelectedUser } = useChatStore();
    const [hiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('cyberpunk_hidden_nexuses') || '[]'));
    const [pinnedNexuses] = useState(() => JSON.parse(localStorage.getItem('cyberpunk_pinned_nexuses') || '[]'));

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
        <aside className="cyberpunk-sidebar">
            <div className="tab-switcher">
                <button className={activeTab === "orbits" ? "active orbits" : ""} onClick={() => { play("click"); setActiveTab("orbits"); }}>⬡ ORBITS</button>
                <button className={activeTab === "contacts" ? "active contacts" : ""} onClick={() => { play("click"); setActiveTab("contacts"); }}>👤 CONTACTS</button>
            </div>

            <div className="action-hub">
                <button className="btn-join" onClick={() => { play("click"); setNexusActionView("join"); }}>JOIN</button>
                <button className="btn-nexus" onClick={() => { play("click"); setNexusActionView("create"); }}>+ NEXUS</button>
            </div>

            <div className="sidebar-list custom-scrollbar">
                {activeTab === "orbits" ? (
                    sortedNexuses.map(n => (
                        <div key={n._id} className="sidebar-item nexus" onClick={() => { play("click"); setSelectedUser(null); setSelectedNexus(n); navigate(`/nexus/${n._id}`); }}>
                            <div className="avatar-wrap">
                                {n.avatar ? <img src={n.avatar} alt="" /> : <PixelAvatarBadge type="bunny" size={30} showDot={false} />}
                            </div>
                            <div className="item-info">
                                <div className="name">{n.name}</div>
                                <div className="meta">NODES: {n.members?.length || 0}</div>
                            </div>
                            {nexusUnread[n._id] > 0 && <div className="unread-count">{nexusUnread[n._id]}</div>}
                        </div>
                    ))
                ) : (
                    users.map(u => (
                        <div key={u._id} className="sidebar-item contact" onClick={() => { play("click"); setSelectedNexus(null); setSelectedUser(u); navigate(`/chat/${u._id}`); }}>
                            <div className="avatar-wrap">
                                {u.profilePic ? <img src={u.profilePic} alt="" /> : <PixelAvatarBadge type="cat" size={30} showDot={false} />}
                            </div>
                            <div className="item-info">
                                <div className="name">{u.username}</div>
                                <div className="meta">STATUS: {u.online ? "ONLINE" : "OFFLINE"}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <div className="sync-control">
                    <div className="label">NEXUS SYNC</div>
                    <div className="toggle-switch active"><div className="knob" /></div>
                </div>
                <div className="orbit-teaser">
                   <div className="teaser-title">ORBIT: COMING SOON</div>
                   <div className="teaser-sub">3D SPATIAL ENGINE</div>
                </div>
            </div>
        </aside>
    );
};

export default memo(CyberpunkSidebar);
