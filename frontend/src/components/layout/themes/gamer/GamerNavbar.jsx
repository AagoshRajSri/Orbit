import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/useAuthStore";

const HiddenNexusWhirl = memo(({ nexus, onReveal }) => {
    const [grabbed, setGrabbed] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!grabbed) return;
        const onMove = (e) => setPos({ x: e.clientX - 16, y: e.clientY - 16 });
        const onUp = () => setGrabbed(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [grabbed]);

    return (
        <div className={`hidden-nexus-whirl ${grabbed ? 'grabbed' : ''}`}
            style={grabbed ? { left: pos.x, top: pos.y, position: 'fixed', zIndex: 9999 } : { position: 'relative' }}
            onMouseDown={(e) => e.detail === 2 && setGrabbed(true)}
            onClick={() => !grabbed && onReveal(nexus._id)}
        >
            🌀
        </div>
    );
});

const GamerNavbar = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [hiddenNexuses, setHiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('gamer_hidden_nexuses') || '[]'));

    const onReveal = (id) => {
        const next = hiddenNexuses.filter(h => h._id !== id);
        setHiddenNexuses(next);
        localStorage.setItem('gamer_hidden_nexuses', JSON.stringify(next));
    };

    return (
        <nav className="gamer-navbar">
            <div className="nav-left">
                <div className="logo">🌀</div>
                <span className="brand">ORBIT</span>
            </div>

            <div className="nav-center">
                {hiddenNexuses.map(nexus => (
                    <HiddenNexusWhirl key={nexus._id} nexus={nexus} onReveal={onReveal} />
                ))}
            </div>

            <div className="nav-stats">
               <div className="stat"><div className="label">KILLS</div><div className="val">14</div></div>
               <div className="stat"><div className="label">K/D</div><div className="val">4.2</div></div>
            </div>

            <div className="nav-actions">
                <button onClick={() => navigate("/settings")}>⚙ CONFIG</button>
                <button onClick={() => navigate("/profile")}>👤 STATUS</button>
                <button className="logout" onClick={logout}>→ OFFLINE</button>
            </div>
        </nav>
    );
};

export default memo(GamerNavbar);
