import React, { memo } from "react";

const OrbitLogo = memo(({ size = 28 }) => {
  const scale = size / 28;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <style>{`
        @keyframes oa-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes oa-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>
      <div style={{ 
        position: "absolute", 
        inset: 0, 
        border: `${1.2 * scale}px solid rgba(198,160,110,.55)`, 
        borderRadius: "50%", 
        animation: "oa-cw 12s linear infinite" 
      }} />
      <div style={{ 
        position: "absolute", 
        inset: `${4.5 * scale}px`, 
        border: `${1 * scale}px solid rgba(78,205,196,.45)`, 
        borderRadius: "50%", 
        animation: "oa-ccw 8s linear infinite" 
      }} />
      <div style={{ 
        position: "absolute", 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%,-50%)", 
        width: `${7 * scale}px`, 
        height: `${7 * scale}px`, 
        background: "#C6A06E", 
        borderRadius: "50%", 
        boxShadow: `0 0 ${8 * scale}px #C6A06E, 0 0 ${15 * scale}px rgba(198,160,110,.4)` 
      }} />
      <div style={{ 
        position: "absolute", 
        top: "50%", 
        left: `-${2 * scale}px`, 
        width: `${5 * scale}px`, 
        height: `${5 * scale}px`, 
        background: "#4ECDC4", 
        borderRadius: "50%", 
        boxShadow: `0 0 ${6 * scale}px #4ECDC4`, 
        marginTop: `${-2.5 * scale}px`, 
        animation: "oa-cw 12s linear infinite", 
        transformOrigin: `${16 * scale}px 0` 
      }} />
    </div>
  );
});

OrbitLogo.displayName = "OrbitLogo";

export default OrbitLogo;
