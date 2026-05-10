import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNexusStore } from "../../../../store/useNexusStore";
import batLogo from "../../../../assets/bat.svg";

const HiddenNexusBat = memo(({ nexus, onReveal }) => {
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
        <div ref={domRef} className={`hidden-nexus-bat ${grabbed ? 'grabbed' : ''}`}
            style={grabbed ? { left: pos.x, top: pos.y } : {}}
            onMouseDown={handleMouseDown}
            onClick={() => !grabbed && onReveal(nexus._id)}
        >
            <svg width="64" height="26" viewBox="0 0 360 140"><path fill="#dc143c" d="M180,105 L186,97 L193,88 C200,81 212,77 226,74 C242,70 258,69 272,77 C281,65 296,55 322,50 C303,33 280,30 262,44 C254,33 241,24 227,32 L210,58 L200,74 L191,86 L184,95 L180,105 L176,95 L169,86 L160,74 L150,58 L133,32 C119,24 106,33 98,44 C80,30 57,33 38,50 C64,55 79,65 88,77 C102,69 118,70 134,74 C148,77 160,81 167,88 L174,97 Z" /><ellipse cx="180" cy="72" rx="22" ry="22" fill="#dc143c" /></svg>
        </div>
    );
});

const VampireNavbar = () => {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const [hiddenNexuses, setHiddenNexuses] = useState(() => JSON.parse(localStorage.getItem('vampire_hidden_nexuses') || '[]'));

    const onReveal = (id) => {
        const next = hiddenNexuses.filter(h => h._id !== id);
        setHiddenNexuses(next);
        localStorage.setItem('vampire_hidden_nexuses', JSON.stringify(next));
    };

    return (
        <nav className="vampire-navbar">
            <div className="nav-logo" onClick={() => navigate("/")}>
                <div className="nav-logo-icon"><img src={batLogo} alt="bat" /></div>
                ORBIT
            </div>

            <div className="nav-center-bats">
                {hiddenNexuses.map(nexus => (
                    <HiddenNexusBat key={nexus._id} nexus={nexus} onReveal={onReveal} />
                ))}
            </div>

            <div className="nav-actions">
                <button className="nav-btn" onClick={() => navigate("/settings")}>SETTINGS</button>
                <button className="nav-btn" onClick={() => navigate("/profile")}>PROFILE</button>
                <button className="nav-btn logout" onClick={logout}>LOGOUT</button>
            </div>
        </nav>
    );
};

export default memo(VampireNavbar);
