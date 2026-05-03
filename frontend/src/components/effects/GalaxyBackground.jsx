import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "./GalaxyBackground.css";
import { useThemeStore } from "../store/useThemeStore";

export default function GalaxyBackground() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    let W = 0, H = 0, dpr = 1;
    let bgStars = [], sparkleStars = [], dustBlobs = [];
    let milkyOpacity = 0.48, milkyX = 0;
    let parallaxX = 0, parallaxY = 0;
    let resizeTimer;
    const rand = (a, b) => a + Math.random() * (b - a);
    const randI = (a, b) => Math.floor(rand(a, b));

    const theme = useThemeStore.getState().theme;
    
    // Neon Cyberpunk colors for dark/gamer/amoled
    const isDarkVariant = theme === "dark" || theme === "gamer-high-energy" || theme === "amoled-dark";
    const isAmoled = theme === "amoled-dark";

    const BG_COLORS = isDarkVariant 
      ? (isAmoled ? ["#4ECDC4", "#C6A06E", "#000000", "#ffffff"] : ["#00f5d4", "#ff2d78", "#00cfff", "#ffffff"])
      : ["#ff8ec8", "#cc88ff", "#ffd8ee", "#f0eeff"];
    const SPARKLE_COLORS = isDarkVariant
      ? (isAmoled ? ["#4ECDC4", "#ffffff", "#C6A06E", "#2b2b2b"] : ["#00f5d4", "#ffffff", "#ff2d78", "#00cfff"])
      : ["#ffffff", "#ffdaf0", "#f8d8ff", "#ffd8ee"];

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }

    function buildStars() {
      bgStars = [];
      sparkleStars = [];
      dustBlobs = [];
      for (let i = 0; i < 320; i++) {
        bgStars.push({
          x: rand(0, W),
          y: rand(0, H),
          r: rand(0.2, 0.65), // Slightly larger stars
          alpha: rand(0.08, 0.28),
          color: BG_COLORS[randI(0, 4)],
        });
      }
      const positions = [];
      let attempts = 0;
      while (positions.length < 22 && attempts < 500) { // More sparkle stars
        attempts++;
        const x = rand(W * 0.04, W * 0.96);
        const y = rand(H * 0.04, H * 0.96);
        const ok = positions.every((p) => Math.hypot(p.x - x, p.y - y) > W * 0.06);
        if (ok) positions.push({ x, y });
      }
      positions.forEach((p) => {
        sparkleStars.push({
          x: p.x,
          y: p.y,
          r: rand(0.5, 1.1),
          glowR: rand(2.2, 4.5), // More intense glow
          alpha: rand(0.65, 0.95),
          twinkleSpeed: rand(1.5, 4.5),
          twinklePhase: rand(0, Math.PI * 2),
          crossLen: rand(6, 18),
          crossAlpha: rand(0.25, 0.55),
          color: SPARKLE_COLORS[randI(0, 4)],
          px: rand(0.03, 0.08),
          py: rand(0.02, 0.05),
        });
      });
      for (let i = 0; i < 8; i++) { // More dust blobs for ambiance
        dustBlobs.push({
          bx: -W * 0.5 + i * (W / 7),
          bySign: Math.random() > 0.5 ? 1 : -1,
          byOff: rand(0, H * 0.12),
          br: rand(50, 180),
          alpha: rand(0.04, 0.1),
          wave: i * 2.2,
        });
      }
    }

    function drawBackground() {
      // Background Ambient Pass
      ctx.fillStyle = isAmoled ? "#000000" : isDarkVariant ? "#04020a" : "#1a0b1c"; 
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.95);
      if (isAmoled) {
        vig.addColorStop(0, "rgba(78, 205, 196, 0.05)"); 
        vig.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
        vig.addColorStop(1, "rgba(0, 0, 0, 1)");
      } else if (isDarkVariant) {
        vig.addColorStop(0, "rgba(0, 245, 212, 0.05)"); 
        vig.addColorStop(0.5, "rgba(4, 2, 10, 0.2)");
        vig.addColorStop(1, "rgba(0, 0, 0, 0.9)");
      } else {
        vig.addColorStop(0, "rgba(255, 142, 200, 0.05)"); // Central pink glow
        vig.addColorStop(0.5, "rgba(100, 30, 80, 0.15)");
        vig.addColorStop(1, "rgba(10, 2, 15, 0.85)"); // Deep dark purple corner
      }
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    function drawMilkyWay(t) {
      ctx.save();
      const cx = W * 0.44 + milkyX + Math.sin(t * 0.00007) * 3;
      ctx.translate(cx, H * 0.5);
      ctx.rotate((-26 * Math.PI) / 180);
      const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, H * 0.68);
      g1.addColorStop(0, `rgba(55,75,140,${milkyOpacity * 0.15})`);
      g1.addColorStop(0.4, `rgba(40,52,110,${milkyOpacity * 0.07})`);
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(-W, -H * 1.2, W * 2, H * 2.4);
      const g2 = ctx.createLinearGradient(0, -H * 0.33, 0, H * 0.33);
      g2.addColorStop(0, "rgba(0,0,0,0)");
      g2.addColorStop(0.35, `rgba(65,58,118,${milkyOpacity * 0.2})`);
      g2.addColorStop(0.5, `rgba(100,88,165,${milkyOpacity * 0.32})`);
      g2.addColorStop(0.65, `rgba(65,58,118,${milkyOpacity * 0.2})`);
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(-W, -H * 0.33, W * 2, H * 0.66);
      const g3 = ctx.createLinearGradient(0, -H * 0.09, 0, H * 0.09);
      g3.addColorStop(0, "rgba(0,0,0,0)");
      g3.addColorStop(0.5, `rgba(160,145,210,${milkyOpacity * 0.1})`);
      g3.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g3;
      ctx.fillRect(-W, -H * 0.09, W * 2, H * 0.18);
      dustBlobs.forEach((b) => {
        const bx = b.bx + Math.sin(b.wave + t * 0.00002) * 10;
        const by = b.bySign * b.byOff;
        const bc = ctx.createRadialGradient(bx, by, 0, bx, by, b.br);
        const dotColor = isAmoled ? "78, 205, 196" : isDarkVariant ? "0, 245, 212" : "130,110,190";
        bc.addColorStop(0, `rgba(${dotColor},${b.alpha * milkyOpacity})`);
        bc.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bc;
        ctx.beginPath();
        ctx.arc(bx, by, b.br, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawBgStars() {
      bgStars.forEach((s) => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawSparkle(s, t) {
      const twinkle = 0.65 + 0.35 * Math.sin((t * 0.001 / s.twinkleSpeed) * Math.PI * 2 + s.twinklePhase);
      const a = s.alpha * twinkle;
      const sx = s.x + s.px * parallaxX;
      const sy = s.y + s.py * parallaxY;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.glowR * 2.5);
      glow.addColorStop(0, `rgba(200,215,255,${a * 0.22})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, s.glowR * 2.5, 0, Math.PI * 2);
      ctx.fill();
      const rot = t * 0.0002;
      const arms = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      arms.forEach(([dx, dy]) => {
        const angle = Math.atan2(dy, dx) + rot;
        const len = s.crossLen * twinkle;
        const ex = sx + Math.cos(angle) * len;
        const ey = sy + Math.sin(angle) * len;
        const cg = ctx.createLinearGradient(sx, sy, ex, ey);
        cg.addColorStop(0, `rgba(255,255,255,${s.crossAlpha * twinkle})`);
        cg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = cg;
        ctx.lineWidth = 0.7;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        const dangle = angle + Math.PI / 4;
        const dlen = len * 0.45;
        const dex = sx + Math.cos(dangle) * dlen;
        const dey = sy + Math.sin(dangle) * dlen;
        const dg = ctx.createLinearGradient(sx, sy, dex, dey);
        dg.addColorStop(0, `rgba(255,255,255,${s.crossAlpha * 0.4 * twinkle})`);
        dg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = dg;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(dex, dey);
        ctx.stroke();
      });
      ctx.globalAlpha = a;
      const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.glowR);
      core.addColorStop(0, "rgba(255,255,255,1)");
      core.addColorStop(0.3, `rgba(220,230,255,${a * 0.7})`);
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sx, sy, s.glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = a * 0.95;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    let rafId;
    function loop(ts) {
      drawBackground();
      drawMilkyWay(ts);
      drawBgStars();
      sparkleStars.forEach((s) => drawSparkle(s, ts));
      rafId = requestAnimationFrame(loop);
    }

    const onMouseMove = (e) => {
      const tx = (e.clientX / W - 0.5) * 20;
      const ty = (e.clientY / H - 0.5) * 14;
      parallaxX += (tx - parallaxX) * 0.05;
      parallaxY += (ty - parallaxY) * 0.05;
    };

    const leaveTween = gsap.to({ x: 0, y: 0 }, {
      paused: true,
      duration: 1.5,
      ease: "power2.out",
      onUpdate() {
        parallaxX = this.targets()[0].x;
        parallaxY = this.targets()[0].y;
      }
    });

    const onMouseLeave = () => {
      gsap.to({ x: parallaxX, y: parallaxY }, {
        x: 0,
        y: 0,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: function () {
          parallaxX = this.targets()[0].x;
          parallaxY = this.targets()[0].y;
        },
      });
    };

    const ambientTweens = [
      gsap.to({ v: 0 }, {
        v: 1, duration: 16, ease: "sine.inOut", yoyo: true, repeat: -1,
        onUpdate: function () { milkyX = this.targets()[0].v * 5 - 2.5; }
      }),
      gsap.to({ v: 0.48 }, {
        v: 0.62, duration: 10, ease: "sine.inOut", yoyo: true, repeat: -1,
        onUpdate: function () { milkyOpacity = this.targets()[0].v; }
      })
    ];

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    resize();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      ambientTweens.forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="galaxy-bg-container" ref={containerRef}>
      <canvas id="galaxy" ref={canvasRef}></canvas>
      <div id="grain"></div>
    </div>
  );
}
