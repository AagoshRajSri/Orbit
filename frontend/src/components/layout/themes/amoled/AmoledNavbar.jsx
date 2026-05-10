import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/useAuthStore";
import OrbitLogo from "../../../common/OrbitLogo";
import RocketAnimation from "../../../effects/RocketAnimation";

const HiddenNexusDiamond = memo(({ nexus, onReveal }) => {
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
        <div ref={domRef} className={`hidden-nexus-diamond ${grabbed ? 'grabbed' : ''}`}
            style={grabbed ? { left: pos.x, top: pos.y, position: 'fixed', zIndex: 9999 } : { position: 'relative' }}
            onMouseDown={handleMouseDown}
            onClick={() => !grabbed && onReveal(nexus._id)}
        >
            💎
        </div>
    );
});

const AmoledNavbar = () => {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const [time, setTime] = useState(() => new Date().toLocaleTimeString());
    const [hiddenNexuses, setHiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('amoled_hidden_nexuses') || '[]'));

    useEffect(() => {
        const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(t);
    }, []);

    const onReveal = (id) => {
        const next = hiddenNexuses.filter(h => h._id !== id);
        setHiddenNexuses(next);
        localStorage.setItem('amoled_hidden_nexuses', JSON.stringify(next));
    };

    return (
        <nav className="amoled-navbar">
            <div className="nav-left">
                <OrbitLogo />
                <span className="brand oa-shimmer-text">ORBIT</span>
                <span className="version">v2.4.1</span>
            </div>

            <div className="nav-center">
                <RocketAnimation />
                <div className="hidden-diamonds">
                    {hiddenNexuses.map(nexus => (
                        <HiddenNexusDiamond key={nexus._id} nexus={nexus} onReveal={onReveal} />
                    ))}
                </div>
            </div>

            <div className="nav-right">
                <div className="clock">{time}_</div>
                <div className="actions">
                   <button onClick={() => navigate("/settings")}><span>⚙</span> SETTINGS</button>
                   <button onClick={() => navigate("/profile")}><span>◉</span> PROFILE</button>
                   <button onClick={logout}><span>⏻</span> LOGOUT</button>
                </div>
            </div>
        </nav>
    );
};

export default memo(AmoledNavbar);
