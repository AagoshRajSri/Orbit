import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import "./OrbitLoader.css";

gsap.registerPlugin(CustomEase);

export default function OrbitLoader({ blendWithParent = false, onComplete = null, timeScale = 1 }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    CustomEase.create("smooth", "M0,0 C0.25,0 0.1,1 1,1");
    CustomEase.create("bounceOut", "M0,0 C0.22,1.5 0.36,1 1,1");

    const ctx = gsap.context(() => {
      const $ = (selectorOrId) =>
        root.querySelector(
          selectorOrId.startsWith("#") ? selectorOrId : `#${selectorOrId}`
        );

      (function spawnParticles() {
        const container = $("particles");
        if (!container) return;
        container.innerHTML = "";
        for (let i = 0; i < 55; i++) {
          const p = document.createElement("div");
          p.className = "particle";
          const s = Math.random() * 2.5 + 0.5;
          p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;opacity:0;`;
          container.appendChild(p);
          gsap.to(p, {
            opacity: Math.random() * 0.45 + 0.05,
            duration: Math.random() * 3 + 2,
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 4,
            ease: "sine.inOut",
          });
          gsap.to(p, {
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 40,
            duration: Math.random() * 8 + 6,
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 5,
            ease: "sine.inOut",
          });
        }
      })();

      gsap.to($("#bg-shift"), { x: 30, y: 20, duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to($("#center-glow"), { scale: 1.35, opacity: 0.7, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to($("#orbit-dot"), { rotation: 360, duration: 3, repeat: -1, ease: "none", transformOrigin: "50% 26px" });

      function animTyping(d1, d2, d3) {
        const tl = gsap.timeline({ repeat: -1 });
        tl.to(d1, { y: -5, duration: 0.28, ease: "power2.out" })
          .to(d1, { y: 0, duration: 0.28, ease: "power2.in" })
          .to(d2, { y: -5, duration: 0.28, ease: "power2.out" }, "-=0.34")
          .to(d2, { y: 0, duration: 0.28, ease: "power2.in" })
          .to(d3, { y: -5, duration: 0.28, ease: "power2.out" }, "-=0.34")
          .to(d3, { y: 0, duration: 0.28, ease: "power2.in" })
          .to({}, { duration: 0.5 });
        return tl;
      }

      function floatIdle(selector, x, y, dur) {
        gsap.to(selector, {
          x,
          y,
          duration: dur,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: Math.random() * 2,
        });
      }

      let typingTlA;
      let typingTlB;
      let typingTlC;

      function resetChat() {
        const rows = ["#ba1", "#ba2", "#ba3", "#ba-typing", "#bb1", "#bb2", "#bb3", "#bb-typing", "#bb-img", "#bc1", "#bc2", "#bc3", "#bc-typing"];
        gsap.set(rows, { opacity: 0, y: 0, scale: 1 });
        gsap.set("#chat-stage", { opacity: 0, scale: 1 });
        gsap.set(["#fa-1", "#fa-2", "#fa-3", "#fa-4"], { opacity: 0, scale: 1 });
        gsap.set("#connection-svg", { opacity: 0 });
        gsap.set("#badge1", { opacity: 0, scale: 0 });
        gsap.set("#tick1", { opacity: 0 });
        gsap.set("#tick2", { opacity: 0 });
        gsap.set("#reaction1", { opacity: 0, scale: 0 });
        gsap.set("#img-fill", { width: "0%" });
        gsap.set(["#ml-1", "#ml-2", "#ml-3"], { opacity: 0, x: 0 });
        gsap.set("#logo-stage", { opacity: 0, scale: 1 });
        gsap.set("#logo-tagline", { opacity: 0, y: 0 });
        gsap.set("#logo-glow", { opacity: 0, scale: 1 });
        if (typingTlA) typingTlA.kill();
        if (typingTlB) typingTlB.kill();
        if (typingTlC) typingTlC.kill();
      }

      function masterLoop() {
        const master = gsap.timeline({
          onComplete: () => {
            if (onComplete) {
              onComplete();
            } else {
              masterLoop();
            }
          }
        });
        if (timeScale) {
          master.timeScale(timeScale);
        }
        master
          .to("#center-glow", { opacity: 1, scale: 1.1, duration: 1.5, ease: "power1.inOut" }, 0)
          .to("#chat-stage", { opacity: 1, duration: 0.7, ease: "power2.out" }, 1.2)
          .from("#chat-stage", { scale: 0.94, duration: 0.9, ease: "expo.out" }, 1.2)
          .to("#ba1", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 1.8)
          .from("#ba1", { y: 14 }, 1.8)
          .to("#ba2", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.35)
          .from("#ba2", { y: 14 }, 2.35)
          .to("#tick1", { opacity: 1, duration: 0.3 }, 2.9)
          .to("#bb1", { opacity: 1, duration: 0.5, ease: "power2.out" }, 2.0)
          .from("#bb1", { y: 14 }, 2.0)
          .to("#bb2", { opacity: 1, duration: 0.5, ease: "power2.out" }, 2.6)
          .from("#bb2", { y: 14 }, 2.6)
          .to("#bc1", { opacity: 1, duration: 0.45, ease: "power2.out" }, 2.2)
          .from("#bc1", { y: 14 }, 2.2)
          .to("#bc2", { opacity: 1, duration: 0.45, ease: "power2.out" }, 2.75)
          .from("#bc2", { y: 14 }, 2.75)
          .to("#ba-typing", { opacity: 1, duration: 0.3, ease: "power2.out" }, 3.1)
          .from("#ba-typing", { y: 8, scale: 0.9 }, 3.1)
          .add(() => { typingTlA = animTyping($("dot-a1"), $("dot-a2"), $("dot-a3")); }, 3.1)
          .to("#bb-typing", { opacity: 1, duration: 0.3, ease: "power2.out" }, 3.4)
          .from("#bb-typing", { y: 8, scale: 0.9 }, 3.4)
          .add(() => { typingTlB = animTyping($("dot-b1"), $("dot-b2"), $("dot-b3")); }, 3.4)
          .to("#bc-typing", { opacity: 1, duration: 0.3, ease: "power2.out" }, 3.6)
          .from("#bc-typing", { y: 8, scale: 0.9 }, 3.6)
          .add(() => { typingTlC = animTyping($("dot-c1"), $("dot-c2"), $("dot-c3")); }, 3.6)
          .to("#ba-typing", { opacity: 0, duration: 0.2 }, 4.8)
          .to("#ba3", { opacity: 1, duration: 0.4, ease: "power2.out" }, 5.0)
          .from("#ba3", { y: 12 }, 5.0)
          .add(() => { if (typingTlA) typingTlA.kill(); }, 5.0)
          .to("#bb-img", { opacity: 1, duration: 0.4, ease: "power2.out" }, 4.6)
          .from("#bb-img", { y: 16, scale: 0.92 }, 4.6)
          .to("#img-fill", { width: "100%", duration: 1.2, ease: "power1.inOut" }, 4.8)
          .to("#reaction1", { opacity: 1, scale: 1, duration: 0.4, ease: "bounceOut" }, 6.2)
          .from("#reaction1", { scale: 0.4 }, 6.2)
          .to("#bb-typing", { opacity: 0, duration: 0.2 }, 5.6)
          .to("#bb3", { opacity: 1, duration: 0.4, ease: "power2.out" }, 5.8)
          .from("#bb3", { y: 12 }, 5.8)
          .to("#tick2", { opacity: 1, duration: 0.3 }, 6.4)
          .add(() => { if (typingTlB) typingTlB.kill(); }, 5.8)
          .to("#bc-typing", { opacity: 0, duration: 0.2 }, 5.2)
          .to("#bc3", { opacity: 1, duration: 0.4, ease: "power2.out" }, 5.4)
          .from("#bc3", { y: 12 }, 5.4)
          .add(() => { if (typingTlC) typingTlC.kill(); }, 5.4)
          .to("#badge1", { opacity: 1, scale: 1, duration: 0.4, ease: "bounceOut" }, 4.4)
          .from("#badge1", { scale: 0 }, 4.4)
          .to("#badge1", { scale: 1.18, duration: 0.25, repeat: 3, yoyo: true }, 4.9)
          .to(["#fa-1", "#fa-2", "#fa-3", "#fa-4"], { opacity: 1, scale: 1, duration: 0.6, stagger: 0.15, ease: "power2.out" }, 6.8)
          .from(["#fa-1", "#fa-2", "#fa-3", "#fa-4"], { scale: 0.5, stagger: 0.15 }, 6.8)
          .to("#connection-svg", { opacity: 1, duration: 0.6, ease: "power2.out" }, 7.4)
          .to("#ml-1", { opacity: 1, x: 80, duration: 0.6, ease: "power2.out" }, 7.0)
          .to("#ml-2", { opacity: 1, x: -60, duration: 0.6, ease: "power2.out" }, 7.2)
          .to("#ml-3", { opacity: 0.6, x: 60, duration: 0.5, ease: "power2.out" }, 7.3)
          .to("#chat-stage", { scale: 0.72, opacity: 0, duration: 1.1, ease: "power2.inOut" }, 8.8)
          .to("#connection-svg", { opacity: 0, duration: 0.7 }, 8.8)
          .to(["#fa-1", "#fa-2", "#fa-3", "#fa-4"], { scale: 0.3, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power2.in" }, 8.8)
          .to(["#ml-1", "#ml-2", "#ml-3"], { opacity: 0, duration: 0.5 }, 9.0)
          .to("#center-glow", { scale: 2.2, opacity: 0.35, duration: 1.0, ease: "power2.out" }, 9.0)
          .to("#logo-stage", { opacity: 1, duration: 0.1 }, 10.0)
          .from("#logo-stage", { scale: 0.78 }, 10.0)
          .to("#logo-stage", { scale: 1, duration: 0.9, ease: "expo.out" }, 10.0)
          .to("#logo-glow", { opacity: 1, scale: 1.4, duration: 1.2, ease: "power2.out" }, 10.0)
          .from("#logo-glow", { opacity: 0, scale: 0.6 }, 10.0)
          .to("#logo-tagline", { opacity: 1, duration: 0.8, ease: "power2.out" }, 10.9)
          .from("#logo-tagline", { y: 8 }, 10.9)
          .to("#logo-glow", { scale: 1.6, opacity: 0.55, duration: 1.5, repeat: 2, yoyo: true, ease: "sine.inOut" }, 11.4)
          .to({}, { duration: 2.2 }, 12.8)
          .to("#logo-tagline", { opacity: 0, y: -6, duration: 0.5, ease: "power2.in" }, 15.0)
          .to("#logo-stage", { opacity: 0, scale: 0.82, duration: 0.9, ease: "power2.in" }, 15.2)
          .to("#logo-glow", { opacity: 0, scale: 0.6, duration: 0.8 }, 15.2)
          .to("#center-glow", { scale: 1, opacity: 0.6, duration: 1.0, ease: "power2.inOut" }, 15.4)
          .add(() => { resetChat(); }, 16.0)
          .to({}, { duration: 0.4 }, 16.0);
      }

      gsap.set("#logo-stage", { opacity: 0 });
      gsap.set("#logo-tagline", { opacity: 0 });
      gsap.set("#logo-glow", { opacity: 0 });
      gsap.set(["#ba1", "#ba2", "#ba3", "#bb1", "#bb2", "#bb3", "#bc1", "#bc2", "#bc3"], { opacity: 0 });
      gsap.set(["#ba-typing", "#bb-typing", "#bc-typing"], { opacity: 0 });
      gsap.set("#bb-img", { opacity: 0 });
      gsap.set(["#fa-1", "#fa-2", "#fa-3", "#fa-4"], { opacity: 0 });
      gsap.set("#connection-svg", { opacity: 0 });
      gsap.set(["#badge1", "#reaction1"], { opacity: 0, scale: 0 });
      gsap.set(["#tick1", "#tick2"], { opacity: 0 });

      floatIdle("#fa-1", 8, -10, 5.5);
      floatIdle("#fa-2", -10, 12, 6.2);
      floatIdle("#fa-3", 12, -8, 4.8);
      floatIdle("#fa-4", -8, 10, 5.9);
      masterLoop();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`orbit-loader${blendWithParent ? " orbit-loader--blend" : ""}`}
      ref={rootRef}
    >
      <div id="scene">
        <div id="bg-gradient"></div>
        <div id="bg-shift"></div>
        <div id="particles"></div>
        <div id="center-glow"></div>

        <svg id="connection-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
          <line id="line-1" x1="200" y1="180" x2="500" y2="300" stroke="rgba(106,174,232,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line id="line-2" x1="800" y1="180" x2="500" y2="300" stroke="rgba(106,174,232,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line id="line-3" x1="300" y1="420" x2="500" y2="300" stroke="rgba(106,174,232,0.15)" strokeWidth="1" strokeDasharray="4,4" />
        </svg>

        <div className="float-avatar" id="fa-1" style={{ top: "18%", left: "10%" }}>K</div>
        <div className="float-avatar" id="fa-2" style={{ top: "15%", right: "12%" }}>M</div>
        <div className="float-avatar" id="fa-3" style={{ bottom: "22%", left: "8%" }}>R</div>
        <div className="float-avatar" id="fa-4" style={{ bottom: "20%", right: "10%" }}>S</div>

        <div className="motion-line" id="ml-1" style={{ top: "35%", left: 0, width: "30%" }}></div>
        <div className="motion-line" id="ml-2" style={{ top: "55%", right: 0, width: "25%", transform: "scaleX(-1)" }}></div>
        <div className="motion-line" id="ml-3" style={{ top: "45%", left: 0, width: "20%" }}></div>

        <div id="chat-stage">
          <div style={{ position: "absolute", left: 0, top: "10%", width: "55%", opacity: 0.65, transform: "scale(0.88) translateX(-20px)" }} id="thread-a">
            <div className="bubble-row" id="ba1">
              <div className="avatar av-c" style={{ position: "relative" }}>K<div className="notif-badge" id="badge1">2</div></div>
              <div className="bubble">Hey, just pushed the new design files!</div>
            </div>
            <div className="bubble-row right" id="ba2">
              <div className="avatar av-a">M</div>
              <div className="bubble">Love it. The gradients look fire<span className="tick" id="tick1">✓✓</span></div>
            </div>
            <div className="bubble-row" id="ba-typing">
              <div className="avatar av-c">K</div>
              <div className="typing-bubble" id="typing-a">
                <div className="dot" id="dot-a1"></div><div className="dot" id="dot-a2"></div><div className="dot" id="dot-a3"></div>
              </div>
            </div>
            <div className="bubble-row" id="ba3" style={{ marginTop: "4px" }}>
              <div className="avatar av-c">K</div>
              <div className="bubble">Working on the animations next</div>
            </div>
          </div>

          <div style={{ position: "absolute", left: "50%", top: "5%", transform: "translateX(-50%)", width: "58%" }} id="thread-b">
            <div className="bubble-row" id="bb1"><div className="avatar av-b">R</div><div className="bubble">Did you see the new Orbit update?</div></div>
            <div className="bubble-row right" id="bb2"><div className="avatar av-a">A</div><div className="bubble">Yes! The loading animation is great</div></div>
            <div className="bubble-row" id="bb-img" style={{ marginTop: "2px" }}>
              <div className="avatar av-b">R</div>
              <div className="img-preview">
                <div className="img-icon">*</div>
                <div className="img-bar"><div className="img-bar-fill" id="img-fill"></div></div>
                <div className="reaction" id="reaction1" style={{ bottom: "-14px", right: "8px" }}>❤️ 3</div>
              </div>
            </div>
            <div className="bubble-row right" id="bb-typing">
              <div className="avatar av-a">A</div>
              <div className="typing-bubble" id="typing-b">
                <div className="dot" id="dot-b1"></div><div className="dot" id="dot-b2"></div><div className="dot" id="dot-b3"></div>
              </div>
            </div>
            <div className="bubble-row right" id="bb3"><div className="avatar av-a">A</div><div className="bubble">Sharing it with the whole team right now<span className="tick" id="tick2">✓✓</span></div></div>
          </div>

          <div style={{ position: "absolute", right: 0, bottom: "8%", width: "52%", opacity: 0.6, transform: "scale(0.86) translateX(18px)" }} id="thread-c">
            <div className="bubble-row right" id="bc1"><div className="avatar av-a">S</div><div className="bubble">Stand-up in 5 mins?</div></div>
            <div className="bubble-row" id="bc2"><div className="avatar av-c">L</div><div className="bubble">On my way!</div></div>
            <div className="bubble-row right" id="bc-typing">
              <div className="avatar av-a">S</div>
              <div className="typing-bubble" id="typing-c">
                <div className="dot" id="dot-c1"></div><div className="dot" id="dot-c2"></div><div className="dot" id="dot-c3"></div>
              </div>
            </div>
            <div className="bubble-row right" id="bc3"><div className="avatar av-a">S</div><div className="bubble">Link sent ✓</div></div>
          </div>
        </div>

        <div id="logo-stage">
          <div id="logo-glow"></div>
          <div id="orbit-logo">
            <div id="logo-icon">
              <div className="orbit-ring orbit-ring-1"></div>
              <div className="orbit-ring orbit-ring-2"></div>
              <div className="orbit-core"></div>
              <div className="orbit-dot" id="orbit-dot"></div>
            </div>
            <div id="logo-wordmark">Orbit</div>
          </div>
          <div id="logo-tagline">Where conversations flow.</div>
        </div>

      </div>
    </div>
  );
}
