import React from "react";

const ChatLoader = () => {
  const styles = {
    // Keyframe animations
    keyframes: `
      @keyframes bgPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 1.3; }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes orbit {
        0% {
          transform: translate(-50%, -50%) rotateZ(0deg) translateX(28px) rotateZ(0deg);
        }
        100% {
          transform: translate(-50%, -50%) rotateZ(360deg) translateX(28px) rotateZ(-360deg);
        }
      }
      @keyframes pulse {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 
            0 0 16px rgba(0, 212, 255, 0.9),
            0 0 30px rgba(0, 212, 255, 0.5),
            inset -3px -3px 6px rgba(0, 0, 0, 0.6);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.3);
          box-shadow: 
            0 0 24px rgba(0, 212, 255, 1),
            0 0 48px rgba(0, 212, 255, 0.8),
            inset -3px -3px 6px rgba(0, 0, 0, 0.6);
        }
      }
      @keyframes bubbleFloat {
        0%, 100% {
          transform: translate(0, 0);
          opacity: 0.3;
        }
        50% {
          transform: translate(0, -12px);
          opacity: 0.8;
        }
      }
      @keyframes textFade {
        0%, 10%, 90%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }
    `,
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100dvh",
      background:
        "linear-gradient(135deg, #0a1628 0%, #0f1f35 50%, #0d1a2e 100%)",
      fontFamily:
        'Dosis, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: "hidden",
      position: "relative",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
      position: "relative",
      zIndex: 1,
    },
    wrapper: {
      position: "relative",
      width: "80px",
      height: "80px",
    },
    bg: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background:
        "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%)",
      boxShadow:
        "inset 0 8px 16px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 200, 255, 0.15)",
      border: "2px solid rgba(0, 200, 255, 0.1)",
    },
    ring: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "2.5px solid transparent",
      borderTop: "2.5px solid #00d4ff",
      borderRight: "2.5px solid #00d4ff",
      borderBottom: "2.5px solid transparent",
      animation: "spin 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite",
      filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))",
    },
    dot: {
      position: "absolute",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, #ff00ff, #c000ff)",
      boxShadow:
        "0 0 12px rgba(255, 0, 255, 0.8), inset -2px -2px 4px rgba(0, 0, 0, 0.4)",
      animation: "orbit 3s linear infinite",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
    dotCyan: {
      position: "absolute",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, #00d4ff, #0088ff)",
      boxShadow:
        "0 0 12px rgba(0, 212, 255, 0.8), inset -2px -2px 4px rgba(0, 0, 0, 0.4)",
      animation: "orbit 3s linear infinite reverse",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
    center: {
      position: "absolute",
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "radial-gradient(circle at 40% 40%, #00d4ff, #0088ff)",
      boxShadow:
        "0 0 16px rgba(0, 212, 255, 0.9), 0 0 30px rgba(0, 212, 255, 0.5), inset -3px -3px 6px rgba(0, 0, 0, 0.6)",
      animation: "pulse 1.5s ease-in-out infinite",
    },
    bubble: {
      position: "absolute",
      borderRadius: "50%",
      border: "1.5px solid rgba(0, 212, 255, 0.4)",
      animation: "bubbleFloat 2.5s ease-in-out infinite",
      opacity: 0.6,
    },
    bubble1: {
      position: "absolute",
      width: "20px",
      height: "20px",
      top: "-8px",
      left: "12px",
      borderRadius: "50%",
      border: "1.5px solid rgba(0, 212, 255, 0.4)",
      animation: "bubbleFloat 2.5s ease-in-out infinite",
      animationDelay: "0s",
      opacity: 0.6,
    },
    bubble2: {
      position: "absolute",
      width: "14px",
      height: "14px",
      top: "8px",
      right: "-6px",
      borderRadius: "50%",
      border: "1.5px solid rgba(0, 212, 255, 0.4)",
      animation: "bubbleFloat 2.5s ease-in-out infinite",
      animationDelay: "0.3s",
      opacity: 0.6,
    },
    bubble3: {
      position: "absolute",
      width: "10px",
      height: "10px",
      bottom: "-4px",
      left: "-4px",
      borderRadius: "50%",
      border: "1.5px solid rgba(0, 212, 255, 0.4)",
      animation: "bubbleFloat 2.5s ease-in-out infinite",
      animationDelay: "0.6s",
      opacity: 0.6,
    },
    text: {
      textAlign: "center",
      fontSize: "13px",
      fontWeight: 500,
      color: "rgba(0, 212, 255, 0.9)",
      letterSpacing: "1.2px",
      textTransform: "uppercase",
      animation: "textFade 1.8s ease-in-out infinite",
      minHeight: "18px",
    },
    bgBefore: {
      content: '""',
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background:
        "radial-gradient(circle at 20% 50%, rgba(0, 200, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(200, 100, 255, 0.02) 0%, transparent 50%)",
      pointerEvents: "none",
      zIndex: -1,
      animation: "bgPulse 8s ease-in-out infinite",
    },
  };

  return (
    <>
      <style>{styles.keyframes}</style>
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.wrapper}>
            <div style={styles.bg}></div>
            <div style={styles.ring}></div>
            <div style={styles.dot}></div>
            <div style={styles.dotCyan}></div>
            <div style={styles.bubble1}></div>
            <div style={styles.bubble2}></div>
            <div style={styles.bubble3}></div>
            <div style={styles.center}></div>
          </div>
          <div style={styles.text}>Connecting to Orbit</div>
        </div>
      </div>
    </>
  );
};

export default ChatLoader;
