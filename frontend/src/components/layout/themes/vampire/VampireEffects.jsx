import { memo, useEffect, useRef, useState, Fragment } from "react";
import { gsap } from "gsap";

export const VampireParticles = memo(() => {
    const containerRef = useRef(null);
    useEffect(() => {
        const container = containerRef.current;
        const particles = [];
        for (let i = 0; i < 18; i++) {
            const p = document.createElement("div");
            p.className = "particle";
            const size = Math.random() * 3 + 1;
            p.style.width = size + "px";
            p.style.height = size + "px";
            p.style.left = Math.random() * 100 + "vw";
            p.style.top = Math.random() * 100 + "vh";
            container.appendChild(p);
            particles.push(p);
            gsap.to(p, {
                opacity: Math.random() * 0.6 + 0.1,
                y: -(Math.random() * 200 + 100),
                x: (Math.random() - 0.5) * 80,
                duration: Math.random() * 8 + 6,
                delay: Math.random() * 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }
        return () => particles.forEach(p => p.remove());
    }, []);
    return <div ref={containerRef} className="vampire-fixed-overlay" />;
});

export const BloodRain = memo(() => {
    const containerRef = useRef(null);
    useEffect(() => {
        const container = containerRef.current;
        const drops = [];
        for (let i = 0; i < 60; i++) {
            const d = document.createElement("div");
            d.className = "blood-drop-particle";
            d.style.left = Math.random() * 100 + "vw";
            const scale = Math.random() * 0.7 + 0.3;
            d.style.transform = `scale(${scale})`;
            d.style.opacity = (Math.random() * 0.5 + 0.2).toString();
            container.appendChild(d);
            drops.push(d);
            gsap.fromTo(d, { y: -100 }, {
                y: "115vh",
                duration: Math.random() * 1.2 + 0.6,
                delay: Math.random() * 6,
                repeat: -1,
                ease: "none"
            });
        }
        return () => drops.forEach(d => d.remove());
    }, []);
    return <div ref={containerRef} className="vampire-fixed-overlay" />;
});

export const Embers = memo(() => {
    const containerRef = useRef(null);
    useEffect(() => {
        const container = containerRef.current;
        const particles = [];
        for (let i = 0; i < 40; i++) {
            const p = document.createElement("div");
            p.className = "ember-particle";
            p.style.left = Math.random() * 100 + "vw";
            container.appendChild(p);
            particles.push(p);
            gsap.fromTo(p, { y: 50, x: 0, opacity: 1 }, {
                y: "-110vh",
                x: (Math.random() - 0.5) * 200,
                opacity: 0,
                duration: Math.random() * 5 + 3,
                delay: Math.random() * 6,
                repeat: -1,
                ease: "sine.out"
            });
        }
        return () => particles.forEach(p => p.remove());
    }, []);
    return <div ref={containerRef} className="vampire-fixed-overlay" />;
});

export const Lightning = memo(() => {
    const [isFlashing, setIsFlashing] = useState(false);
    const [bolt, setBolt] = useState(null);
    const thunderRef = useRef(new Audio("https://actions.google.com/sounds/v1/weather/rolling_thunder.ogg"));
    const generatePaths = () => {
        let curX = 50, curY = 0;
        let mainPath = `M ${curX} ${curY}`;
        const branches = [];
        for (let i = 0; i < 12; i++) {
            curX += (Math.random() - 0.5) * 40;
            curY += 40;
            mainPath += ` L ${curX} ${curY}`;
            if (Math.random() > 0.7) {
                let bx = curX, by = curY;
                let bPath = `M ${bx} ${by}`;
                for (let j = 0; j < 4; j++) {
                    bx += (Math.random() - 0.5) * 50;
                    by += 30;
                    bPath += ` L ${bx} ${by}`;
                }
                branches.push(bPath);
            }
        }
        return [mainPath, ...branches];
    };
    useEffect(() => {
        const triggerFlash = () => {
            const sequence = async () => {
                const paths = generatePaths();
                setBolt({ x: (Math.random() * 90 + 5) + "vw", scale: Math.random() * 0.5 + 0.7, paths });
                setIsFlashing(true);
                setTimeout(() => {
                    thunderRef.current.volume = 0.4;
                    thunderRef.current.currentTime = 0;
                    thunderRef.current.play().catch(() => {});
                }, 200);
                await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
                setIsFlashing(false);
                if (Math.random() > 0.4) {
                    await new Promise(r => setTimeout(r, 80));
                    setIsFlashing(true);
                    await new Promise(r => setTimeout(r, 40));
                    setIsFlashing(false);
                }
                setTimeout(() => setBolt(null), 350);
            };
            sequence();
            setTimeout(triggerFlash, 8000 + Math.random() * 12000);
        };
        const timer = setTimeout(triggerFlash, 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isFlashing) document.body.classList.add('flash-active');
        else document.body.classList.remove('flash-active');
    }, [isFlashing]);

    return (
        <>
            <div className="lightning-overlay" style={{ background: isFlashing ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }} />
            {isFlashing && bolt && (
                <svg width="400" height="800" viewBox="-150 0 400 600" className="lightning-bolt-svg" style={{ left: bolt.x, transform: `scale(${bolt.scale})` }}>
                    {bolt.paths.map((d, i) => (
                        <Fragment key={i}>
                            <path d={d} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={i === 0 ? "1.5" : "0.8"} strokeLinejoin="round" strokeLinecap="round" />
                            <path d={d} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={i === 0 ? "4" : "2"} strokeLinejoin="round" strokeLinecap="round" style={{ filter: 'blur(3px)' }} />
                        </Fragment>
                    ))}
                </svg>
            )}
        </>
    );
});

const HangingBat = memo(({ right = 60, top = 0, delay = "0s", scale = 1, opacity = 1 }) => (
    <div className="hanging-bat-container" style={{ right, top, animationDelay: delay, transform: `scale(${scale})` }}>
        <div className="mist-hazard" style={{ opacity }} />
        <svg width="60" height="70" viewBox="0 0 100 120">
            <g className="bat-body" style={{ opacity: 0 }}>
                <path fill="#080808" d="M50 10C55 10 58 15 58 22C58 35 50 45 50 45C50 45 42 35 42 22C42 15 45 10 50 10Z" />
                <path fill="#080808" d="M50 45C50 45 20 60 15 85C13 95 25 110 50 115C75 110 87 95 85 85C80 60 50 45 50 45Z" />
                <path fill="#444" d="M44 12L40 2L46 10Z" /><path fill="#444" d="M56 12L60 2L54 10Z" />
            </g>
            <circle className="bat-eyes" cx="47" cy="22" r="2" fill="#ff0000" />
            <circle className="bat-eyes" cx="53" cy="22" r="2" fill="#ff0000" />
        </svg>
    </div>
));

export const HangingBats = memo(() => (
    <>
        <HangingBat right={70} top={-25} delay="2s" scale={0.6} opacity={0.4} />
        <HangingBat right={140} top={-15} delay="3.5s" scale={0.7} opacity={0.4} />
        <HangingBat right={210} top={-20} delay="1.8s" scale={0.65} opacity={0.3} />
        <HangingBat right={40} top={-10} delay="0s" scale={0.8} />
        <HangingBat right={110} top={0} delay="1.2s" scale={1} />
        <HangingBat right={180} top={-5} delay="0.5s" scale={0.9} />
    </>
));
