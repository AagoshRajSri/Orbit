import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSpring, animated, config } from "@react-spring/three";
import * as THREE from "three";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
export const PALETTE = {
  bg: "#0a0a0f",
  surface: "#12121a",
  glass: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#7c6cfc",
  accentGlow: "rgba(124,108,252,0.3)",
  gold: "#f5c842",
  text: "#e8e8f0",
  muted: "#6b6b80",
  bubble1: "#1e1e2e",
  bubble2: "#2a1f3d",
  online: "#3ddc84",
};

// ─── AVATAR STATE MACHINE ───────────────────────────────────────────────────
export const STATES = {
  HIDDEN: "hidden",
  ENTERING: "entering",
  IDLE: "idle",
  ALERT: "alert",
  REACTING: "reacting",
  RESTING: "resting",
};

// ─── CAT HEAD 3D (Procedural geometry, no external model needed) ──────────
function CatFur({ position, color, roughness = 0.9 }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
    </mesh>
  );
}

function CatEye({ position, isLeft, lookTarget, blinking }) {
  const eyeRef = useRef();
  const pupilRef = useRef();
  const blinkRef = useRef();

  useFrame((state) => {
    if (!eyeRef.current) return;
    const t = state.clock.elapsedTime;

    // Pupil dilation based on excitement
    const pulse = Math.sin(t * 2) * 0.02;
    if (pupilRef.current) {
      pupilRef.current.scale.setScalar(1 + pulse);
    }

    // Look toward target
    if (lookTarget.current && eyeRef.current) {
      const target = lookTarget.current;
      const dx = target.x * 0.03;
      const dy = target.y * 0.03;
      eyeRef.current.position.x = position[0] + dx;
      eyeRef.current.position.y = position[1] + dy;
    }

    // Blink
    if (blinkRef.current) {
      blinkRef.current.scale.y = blinking.current ? 0.05 : 1;
    }
  });

  return (
    <group>
      {/* Eye white */}
      <mesh position={position} ref={eyeRef}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Iris */}
      <mesh position={[position[0], position[1], position[2] + 0.06]}>
        <circleGeometry args={[0.055, 32]} />
        <meshStandardMaterial color="#7c9e3d" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Pupil */}
      <mesh
        ref={pupilRef}
        position={[position[0], position[1], position[2] + 0.07]}
        scale={[0.5, 1, 1]}
      >
        <circleGeometry args={[0.038, 16]} />
        <meshStandardMaterial color="#050508" roughness={0} metalness={0} />
      </mesh>
      {/* Catchlight */}
      <mesh position={[position[0] + 0.02, position[1] + 0.02, position[2] + 0.075]}>
        <circleGeometry args={[0.008, 8]} />
        <meshStandardMaterial color="white" roughness={0} metalness={0} emissive="white" emissiveIntensity={2} />
      </mesh>
      {/* Blink lid */}
      <mesh
        ref={blinkRef}
        position={[position[0], position[1], position[2] + 0.08]}
      >
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#c9956b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CatEar({ position, rotation, state }) {
  const ref = useRef();
  const { earRot } = useSpring({
    earRot: state === STATES.ALERT ? 0.3 : state === STATES.REACTING ? -0.15 : 0,
    config: config.wobbly,
  });

  return (
    <animated.group position={position} ref={ref} rotation-z={earRot}>
      {/* Outer ear */}
      <mesh rotation={rotation}>
        <coneGeometry args={[0.12, 0.22, 3]} />
        <meshStandardMaterial color="#c9956b" roughness={0.85} />
      </mesh>
      {/* Inner ear */}
      <mesh rotation={rotation} position={[0, 0.01, 0.01]}>
        <coneGeometry args={[0.07, 0.15, 3]} />
        <meshStandardMaterial color="#e8b4a0" roughness={0.9} />
      </mesh>
    </animated.group>
  );
}

function CatWhisker({ start, end, side }) {
  const ref = useRef();
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3((start[0] + end[0]) / 2, start[1] + (side === "left" ? 0.02 : -0.02), start[2] + 0.1),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(20);
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7 + (side === "left" ? 0 : Math.PI)) * 0.015;
    }
  });

  return (
    <line ref={ref} geometry={geo}>
      <lineBasicMaterial color="#d4b896" opacity={0.6} transparent linewidth={1} />
    </line>
  );
}

function CatAvatar({ avatarState, lookTarget, blinking }) {
  const groupRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const tailRef = useRef();
  const noseRef = useRef();

  const { bodyY, headTilt, bodyScale, headScale } = useSpring({
    bodyY: avatarState === STATES.HIDDEN ? -2.5
      : avatarState === STATES.ENTERING ? 0.1
      : avatarState === STATES.ALERT ? 0.2
      : avatarState === STATES.REACTING ? 0.15
      : avatarState === STATES.RESTING ? -0.3
      : 0,
    headTilt: avatarState === STATES.REACTING ? 0.18
      : avatarState === STATES.ALERT ? -0.1
      : avatarState === STATES.RESTING ? 0.08
      : 0,
    bodyScale: avatarState === STATES.HIDDEN ? 0 : 1,
    headScale: avatarState === STATES.REACTING ? 1.05 : 1,
    config: { mass: 1.5, tension: 120, friction: 18 },
  });

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Breathing
    const breathe = Math.sin(t * 1.2) * 0.012;
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + breathe;
      bodyRef.current.scale.x = 1 - breathe * 0.3;
    }

    // Subtle head sway
    if (headRef.current) {
      headRef.current.rotation.z += (Math.sin(t * 0.4) * 0.015 - headRef.current.rotation.z) * 0.05;
    }

    // Tail wag (idle/reacting)
    if (tailRef.current && (avatarState === STATES.IDLE || avatarState === STATES.REACTING)) {
      tailRef.current.rotation.z = Math.sin(t * (avatarState === STATES.REACTING ? 3 : 1.5)) * 0.4;
    }

    // Nose subtle pulse
    if (noseRef.current) {
      noseRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
    }
  });

  const furColor = "#c9956b";
  const bodyColor = "#b8845c";
  const bellyColor = "#e8d5c0";

  return (
    <animated.group
      ref={groupRef}
      position-y={bodyY}
      scale={bodyScale}
    >
      {/* Body */}
      <animated.group ref={bodyRef} position={[0, -0.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.28, 0.45, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.88} />
        </mesh>
        {/* Belly */}
        <mesh position={[0, 0.05, 0.22]} scale={[0.8, 1, 1]}>
          <circleGeometry args={[0.22, 32]} />
          <meshStandardMaterial color={bellyColor} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </animated.group>

      {/* Tail */}
      <group ref={tailRef} position={[0, -0.7, -0.25]} rotation={[0.5, 0, 0.3]}>
        <mesh>
          <capsuleGeometry args={[0.05, 0.55, 6, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.9} />
        </mesh>
        {/* Tail tip */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={bellyColor} roughness={0.95} />
        </mesh>
      </group>

      {/* Paws */}
      {[-0.22, 0.22].map((x, i) => (
        <group key={i} position={[x, -0.85, 0.18]}>
          <mesh>
            <capsuleGeometry args={[0.08, 0.1, 6, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.85} />
          </mesh>
          {/* Toes */}
          {[-0.04, 0, 0.04].map((tx, j) => (
            <mesh key={j} position={[tx, -0.08, 0.04]}>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshStandardMaterial color={bellyColor} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* HEAD */}
      <animated.group
        ref={headRef}
        position={[0, 0.18, 0]}
        rotation-z={headTilt}
        scale={headScale}
      >
        {/* Head sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color={furColor} roughness={0.87} />
        </mesh>

        {/* Forehead stripe */}
        <mesh position={[0, 0.22, 0.3]}>
          <planeGeometry args={[0.12, 0.18]} />
          <meshStandardMaterial color="#a67a52" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>

        {/* Muzzle */}
        <mesh position={[0, -0.08, 0.3]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color={bellyColor} roughness={0.9} />
        </mesh>

        {/* Nose */}
        <mesh ref={noseRef} position={[0, 0.01, 0.46]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#e87c8a" roughness={0.5} metalness={0.1} />
        </mesh>

        {/* Mouth */}
        <mesh position={[-0.04, -0.075, 0.46]} rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.03, 0.006, 6, 16, Math.PI * 0.6]} />
          <meshStandardMaterial color="#c06070" roughness={0.7} />
        </mesh>
        <mesh position={[0.04, -0.075, 0.46]} rotation={[0, 0, -0.4]}>
          <torusGeometry args={[0.03, 0.006, 6, 16, Math.PI * 0.6]} />
          <meshStandardMaterial color="#c06070" roughness={0.7} />
        </mesh>

        {/* Eyes */}
        <CatEye
          position={[-0.14, 0.08, 0.3]}
          isLeft={true}
          lookTarget={lookTarget}
          blinking={blinking}
        />
        <CatEye
          position={[0.14, 0.08, 0.3]}
          isLeft={false}
          lookTarget={lookTarget}
          blinking={blinking}
        />

        {/* Ears */}
        <CatEar
          position={[-0.22, 0.28, 0.05]}
          rotation={[0, 0, -0.2]}
          state={avatarState}
        />
        <CatEar
          position={[0.22, 0.28, 0.05]}
          rotation={[0, 0, 0.2]}
          state={avatarState}
        />

        {/* Whiskers */}
        <CatWhisker start={[-0.17, -0.05, 0.44]} end={[-0.52, -0.02, 0.3]} side="left" />
        <CatWhisker start={[-0.17, -0.08, 0.44]} end={[-0.5, -0.1, 0.3]} side="left" />
        <CatWhisker start={[-0.17, -0.11, 0.44]} end={[-0.48, -0.16, 0.28]} side="left" />
        <CatWhisker start={[0.17, -0.05, 0.44]} end={[0.52, -0.02, 0.3]} side="right" />
        <CatWhisker start={[0.17, -0.08, 0.44]} end={[0.5, -0.1, 0.3]} side="right" />
        <CatWhisker start={[0.17, -0.11, 0.44]} end={[0.48, -0.16, 0.28]} side="right" />

        {/* Fur tufts (micro detail) */}
        {[[-0.18, 0.3, 0.15], [0.18, 0.3, 0.15], [0, 0.35, 0.1], [-0.28, 0.1, 0.1], [0.28, 0.1, 0.1]].map(
          (pos, i) => (
            <CatFur key={i} position={pos} color={furColor} roughness={0.95} />
          )
        )}
      </animated.group>

      {/* Emotion sparkles on react */}
      {avatarState === STATES.REACTING && <EmotionParticles />}
    </animated.group>
  );
}

function EmotionParticles() {
  const ref = useRef();
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      radius: 0.5 + Math.random() * 0.3,
      speed: 0.8 + Math.random() * 0.5,
      size: 0.015 + Math.random() * 0.02,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      const r = p.radius + Math.sin(t * p.speed + p.offset) * 0.15;
      child.position.x = Math.cos(p.angle + t * 0.5) * r;
      child.position.y = Math.sin(p.angle + t * 0.5) * r + 0.5;
      child.scale.setScalar(1 + Math.sin(t * 3 + p.offset) * 0.3);
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#7c6cfc" : i % 3 === 1 ? "#f5c842" : "#ff7eb3"}
            emissive={i % 3 === 0 ? "#7c6cfc" : i % 3 === 1 ? "#f5c842" : "#ff7eb3"}
            emissiveIntensity={1.5}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── SCENE WRAPPER ──────────────────────────────────────────────────────────
export function AvatarScene({ avatarState, mousePos }) {
  const lookTarget = useRef({ x: 0, y: 0 });
  const blinking = useRef(false);

  // Blink loop
  useEffect(() => {
    const doBlink = () => {
      blinking.current = true;
      setTimeout(() => {
        blinking.current = false;
        const next = 2500 + Math.random() * 3500;
        setTimeout(doBlink, next);
      }, 120 + Math.random() * 60);
    };
    const initial = setTimeout(doBlink, 1000);
    return () => clearTimeout(initial);
  }, []);

  useEffect(() => {
    lookTarget.current = { x: mousePos.x * 2 - 1, y: -(mousePos.y * 2 - 1) };
  }, [mousePos]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#9090cc" />
      <directionalLight
        position={[2, 4, 3]}
        intensity={1.8}
        color="#ffd4a0"
        castShadow
      />
      <pointLight position={[-2, 1, 2]} intensity={0.6} color="#7c6cfc" />
      <pointLight position={[0, -1, 3]} intensity={0.3} color="#ff9060" />

      <CatAvatar
        avatarState={avatarState}
        lookTarget={lookTarget}
        blinking={blinking}
      />
    </>
  );
}

// ─── TYPING INDICATOR ───────────────────────────────────────────────────────
export function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: PALETTE.muted,
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── STATUS RING ────────────────────────────────────────────────────────────
export function StatusRing({ state }) {
  const color = state === STATES.ALERT || state === STATES.REACTING
    ? PALETTE.accent
    : state === STATES.RESTING
    ? PALETTE.muted
    : PALETTE.online;

  return (
    <div style={{
      position: "absolute",
      inset: -3,
      borderRadius: "50%",
      border: `2px solid ${color}`,
      boxShadow: `0 0 12px ${color}80`,
      transition: "border-color 0.4s, box-shadow 0.4s",
    }} />
  );
}

// App orchestration logic has been moved to NexusChatContainer
