import { memo, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../../../../store/useNexusStore";
import { useChatStore } from "../../../../store/useChatStore";
import { PixelAvatarBadge } from "../../../avatar/PixelAvatar/PixelAvatarBadge.jsx";

const AmoledSidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const { nexuses, isNexusesLoading, setSelectedNexus, nexusUnread, setNexusActionView } = useNexusStore();
    const { users, setSelectedUser } = useChatStore();
    const [pinnedNexuses] = useState(() => JSON.parse(localStorage.getItem('amoled_pinned_nexuses') || '[]'));
    const [hiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('amoled_hidden_nexuses') || '[]'));

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
        <aside className="amoled-sidebar">
            <div className="tab-control">
                <div className="main-tabs">
                    <button className={activeTab === "orbits" ? "active" : ""} onClick={() => setActiveTab("orbits")}>❖ ORBITS</button>
                    <button className={activeTab === "contacts" ? "active" : ""} onClick={() => setActiveTab("contacts")}>◉ CONTACTS</button>
                </div>
                <div className="action-tabs">
                    <button onClick={() => setNexusActionView("join")}>+ JOIN ENGINE</button>
                    <button onClick={() => setNexusActionView("create")}>✧ NEXUS HUB</button>
                </div>
            </div>

            <div className="sidebar-list custom-scrollbar">
                {activeTab === "orbits" ? (
                    sortedNexuses.map(n => (
                        <div key={n._id} className="sidebar-item" onClick={() => { setSelectedUser(null); setSelectedNexus(n); navigate(`/nexus/${n._id}`); }}>
                            <div className="item-inner">
                                <div className="avatar-mini">
                                    {n.avatar ? <img src={n.avatar} alt="" /> : <PixelAvatarBadge type="dog" size={24} showDot={false} />}
                                </div>
                                <span className="name">{n.name}</span>
                                {nexusUnread[n._id] > 0 && <span className="unread">{nexusUnread[n._id]}</span>}
                                <span className="count">{n.members?.length || 0}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    users.map(u => (
                        <div key={u._id} className="sidebar-item" onClick={() => { setSelectedNexus(null); setSelectedUser(u); navigate(`/chat/${u._id}`); }}>
                             <div className="item-inner">
                                <div className="avatar-mini">
                                    {u.profilePic ? <img src={u.profilePic} alt="" /> : <PixelAvatarBadge type="cat" size={38} showDot={false} />}
                                </div>
                                <div className="info">
                                    <div className="name">{u.username}</div>
                                    <div className="status">{u.status === "online" ? "CONNECTED" : "OFFLINE"}</div>
                                </div>
                             </div>
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <div className="orbit-teaser">
                   <div className="icon">🔒</div>
                   <div className="content">
                      <div className="title">ORBIT: COMING SOON</div>
                      <div className="subtitle">SEQUENCING DIMENSION</div>
                   </div>
                </div>
            </div>
        </aside>
    );
};

export default memo(AmoledSidebar);
