import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useSoundManager } from "../../../../hooks/useSoundManager";

const HiddenNexusCrystal = memo(({ nexus, onReveal }) => {
    const [grabbed, setGrabbed] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const domRef = useRef(null);
    const offsetRef = useRef({ ox: 0, oy: 0 });

    useEffect(() => {
        if (!grabbed) return;
        const onMove = (e) => setPos({ x: e.clientX - offsetRef.current.ox, y: e.clientY - offsetRef.current.oy });
        const onUp = () => setGrabbed(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [grabbed]);

    const handleMouseDown = (e) => {
        if (e.detail === 2) {
            e.preventDefault();
            const rect = domRef.current.getBoundingClientRect();
            setPos({ x: rect.left, y: rect.top });
            offsetRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
            setGrabbed(true);
        }
    };

    return (
        <div ref={domRef} className={`hidden-nexus-crystal ${grabbed ? 'grabbed' : ''}`}
            style={grabbed ? { left: pos.x, top: pos.y, position: 'fixed', zIndex: 9999 } : { position: 'relative' }}
            onMouseDown={handleMouseDown}
            onClick={() => !grabbed && onReveal(nexus._id)}
        >
            🔮
        </div>
    );
});

const CyberpunkNavbar = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const { play } = useSoundManager();
    const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const [hiddenNexuses, setHiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('cyberpunk_hidden_nexuses') || '[]'));

    useEffect(() => {
        const iv = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })), 1000);
        return () => clearInterval(iv);
    }, []);

    const onReveal = (id) => {
        const next = hiddenNexuses.filter(h => h._id !== id);
        setHiddenNexuses(next);
        localStorage.setItem('cyberpunk_hidden_nexuses', JSON.stringify(next));
    };

    return (
        <nav className="cyberpunk-navbar">
            <div className="nav-logo" onClick={() => { play("click"); navigate("/"); }}>
                <div className="logo-icon">🌀</div>
                <span className="brand-text">ORBIT</span>
                <span className="tag-vrc">//VRC</span>
            </div>

            <div className="nav-center-crystals">
                {hiddenNexuses.map(nexus => (
                    <HiddenNexusCrystal key={nexus._id} nexus={nexus} onReveal={onReveal} />
                ))}
            </div>

            <div className="nav-hud-metrics">
                <div className="hud-metric"><div className="label">NODES</div><div className="val">14k+</div></div>
                <div className="hud-metric"><div className="label">NEXUS</div><div className="val">1337</div></div>
                <div className="hud-metric"><div className="label">PING</div><div className="val">12ms</div></div>
                <div className="hud-clock">{time}</div>
            </div>

            <div className="nav-actions">
                <button onClick={() => { play("click"); navigate("/settings"); }}>⚙ CONFIG</button>
                <button onClick={() => { play("click"); navigate("/profile"); }}>👤 STATUS</button>
                <button className="logout" onClick={() => { play("click"); logout(); }}>→ OFFLINE</button>
            </div>
        </nav>
    );
};

export default memo(CyberpunkNavbar);
