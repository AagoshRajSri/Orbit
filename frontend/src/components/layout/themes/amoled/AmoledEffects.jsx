import { memo, useState, useEffect, useRef } from "react";

export const StarField = memo(({ count = 40 }) => {
  const stars = Array.from({ length: count }, (_, i) => ({
    x: (i * 37 + 13) % 100,
    y: (i * 61 + 7) % 100,
    delay: (i * 0.31) % 5,
    dur: 2 + (i % 4),
  }));
  return (
    <div className="amoled-starfield">
      {stars.map((s, i) => (
        <div key={i} className="oa-star" style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
      ))}
    </div>
  );
});

export const DataStream = memo(({ x, delay, dur }) => {
  const chars = "01ABCDEF※△▽◆■★";
  const stream = Array.from({ length: 14 }, (_, i) => chars[(i * 7) % chars.length]);
  return (
    <div className="oa-stream-char" style={{ left: x, top: "-90px", animationDuration: dur, animationDelay: delay }}>
      {stream.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  );
});

export const AmoledBackground = memo(() => (
    <div className="amoled-background-root">
       <StarField count={40} />
       <div className="oa-nebula amoled-nebula-1" />
       <div className="oa-nebula amoled-nebula-2" />
       <div className="oa-nebula amoled-nebula-3" />
       {[{ x: "10%", delay: "0s", dur: "20s" }, { x: "55%", delay: "8s", dur: "26s" }, { x: "82%", delay: "14s", dur: "19s" }].map((s, i) => (
        <DataStream key={i} x={s.x} delay={s.delay} dur={s.dur} />
      ))}
    </div>
));
