import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   PLANET DATA
───────────────────────────────────────────── */
const PLANETS = [
  {
    name: "Aelion",
    radius: 0.14,
    orbitR: 2.0,
    speed: 2.2,
    color: "#7ee8fa",
    emissive: "#0a4a6a",
    tilt: 0.2,
  },
  {
    name: "Verath",
    radius: 0.22,
    orbitR: 3.2,
    speed: 1.5,
    color: "#f7b46e",
    emissive: "#6a2800",
    tilt: 0.5,
  },
  {
    name: "Solara",
    radius: 0.3,
    orbitR: 4.5,
    speed: 1.0,
    color: "#80ffa0",
    emissive: "#0a4020",
    tilt: 0.35,
  },
  {
    name: "Dravex",
    radius: 0.2,
    orbitR: 5.8,
    speed: 0.65,
    color: "#d08eff",
    emissive: "#3a006a",
    tilt: 0.6,
  },
  {
    name: "Zynthos",
    radius: 0.42,
    orbitR: 7.6,
    speed: 0.38,
    color: "#ffd166",
    emissive: "#5a3000",
    tilt: 0.15,
  },
  {
    name: "Cryovex",
    radius: 0.18,
    orbitR: 9.2,
    speed: 0.2,
    color: "#a8d8ea",
    emissive: "#0a2a4a",
    tilt: 0.8,
  },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function buildStars(count = 4000) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sz = new Float32Array(count);
  const palette = [
    [1, 1, 1],
    [0.7, 0.85, 1],
    [1, 0.95, 0.8],
    [0.85, 0.75, 1],
    [0.6, 0.9, 1],
  ];
  for (let i = 0; i < count; i++) {
    const r = 100 + Math.random() * 150;
    const phi = Math.acos(2 * Math.random() - 1);
    const th = Math.random() * Math.PI * 2;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(phi);
    sz[i] = 0.4 + Math.random() * 2.2;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i * 3] = c[0];
    col[i * 3 + 1] = c[1];
    col[i * 3 + 2] = c[2];
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.PointsMaterial({
    size: 0.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

function buildOrbitRing(r) {
  const pts = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.18,
  });
  return new THREE.LineLoop(geo, mat);
}

function buildPlanetTexture(seed, hex) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const rn = (n) => {
    let x = Math.sin(seed * 93.1 + n * 377.3) * 43758.5;
    return x - Math.floor(x);
  };
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = rn(i + 300) * 0.3 + 0.04;
    ctx.fillStyle = rn(i + 400) > 0.5 ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.ellipse(
      rn(i) * 256,
      rn(i + 100) * 256,
      rn(i + 200) * 28 + 4,
      (rn(i + 200) * 28 + 4) * (0.3 + rn(i + 500) * 0.7),
      rn(i + 600) * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(c);
}

function buildSun() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffdd44,
      emissive: 0xff6600,
      emissiveIntensity: 2.2,
      roughness: 0.5,
      metalness: 0,
    }),
  );
  group.add(core);
  [
    [1.25, 0xff8800, 0.14],
    [1.7, 0xff5500, 0.07],
    [2.4, 0xff3300, 0.03],
  ].forEach(([r, col, op]) => {
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: op,
          side: THREE.FrontSide,
        }),
      ),
    );
  });
  return { group, core };
}

function buildPlanet(p, idx) {
  const tex = buildPlanetTexture(idx + 1, p.color);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.radius, 48, 48),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(p.emissive),
      emissiveIntensity: 0.25,
      roughness: 0.8,
      metalness: 0.05,
    }),
  );
  mesh.castShadow = true;

  mesh.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(p.radius * 1.18, 32, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(p.color),
        transparent: true,
        opacity: 0.09,
        side: THREE.FrontSide,
      }),
    ),
  );

  if (p.name === "Zynthos") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(p.radius * 1.45, p.radius * 2.1, 64),
      new THREE.MeshBasicMaterial({
        color: 0xd4aa60,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = Math.PI / 2.5;
    mesh.add(ring);
  }

  const pivot = new THREE.Group();
  pivot.rotation.z = p.tilt;
  pivot.add(mesh);
  return { mesh, pivot, angle: Math.random() * Math.PI * 2 };
}

function buildAsteroidBelt(beltR = 6.7, count = 800) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    const r = beltR + (Math.random() - 0.5) * 0.9;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 0.25;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0x7799bb,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
    }),
  );
}

function buildNebula() {
  const geo = new THREE.BufferGeometry();
  const count = 1200;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const colors = [
    [0.2, 0.1, 0.6],
    [0.1, 0.3, 0.7],
    [0.5, 0.1, 0.4],
    [0.1, 0.4, 0.5],
  ];
  for (let i = 0; i < count; i++) {
    const r = 18 + Math.random() * 30;
    const th = Math.random() * Math.PI * 2;
    const ph = (Math.random() - 0.5) * Math.PI * 0.4;
    pos[i * 3] = Math.cos(th) * Math.cos(ph) * r;
    pos[i * 3 + 1] = Math.sin(ph) * r * 0.4;
    pos[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r;
    const c = colors[Math.floor(Math.random() * colors.length)];
    col[i * 3] = c[0];
    col[i * 3 + 1] = c[1];
    col[i * 3 + 2] = c[2];
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.08,
      sizeAttenuation: true,
    }),
  );
}

function useFlicker() {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    let timeout;
    const cycle = () => {
      const delay = 500 + Math.random() * 900;
      timeout = setTimeout(() => {
        setVis(false);
        setTimeout(
          () => {
            setVis(true);
            cycle();
          },
          120 + Math.random() * 200,
        );
      }, delay);
    };
    cycle();
    return () => clearTimeout(timeout);
  }, []);
  return vis;
}

function disposeScene(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose?.();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m) return;
        if (m.map) m.map.dispose?.();
        m.dispose?.();
      });
    }
  });
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function OrbitLanding({ onComplete }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const flickOn = useFlicker();

  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00020f, 0.007);
    const camera = new THREE.PerspectiveCamera(
      52,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500,
    );
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x080820, 0.8));
    const sunLight = new THREE.PointLight(0xffeebb, 4.0, 80);
    sunLight.castShadow = true;
    scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0x2244aa, 0.5);
    fill.position.set(-12, 8, -12);
    scene.add(fill);
    const backRim = new THREE.DirectionalLight(0x6633aa, 0.3);
    backRim.position.set(10, -5, 10);
    scene.add(backRim);

    const stars = buildStars();
    const nebula = buildNebula();
    scene.add(stars, nebula);

    const { group: sunGroup, core: sunCore } = buildSun();
    scene.add(sunGroup);

    const planetData = PLANETS.map((p, i) => {
      const obj = buildPlanet(p, i);
      scene.add(obj.pivot);
      scene.add(buildOrbitRing(p.orbitR));
      return { ...obj, meta: p };
    });

    scene.add(buildAsteroidBelt());

    const ringGeo = new THREE.RingGeometry(8.5, 9.2, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1133aa,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    });
    const decorRing = new THREE.Mesh(ringGeo, ringMat);
    decorRing.rotation.x = Math.PI / 2.2;
    scene.add(decorRing);

    stateRef.current = {
      scene,
      camera,
      renderer,
      sunCore,
      sunGroup,
      stars,
      nebula,
      planetData,
      decorRing,
    };

    let raf;
    let t = 0;
    let sunPulse = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.007;
      sunPulse += 0.018;

      const pulse = 1 + Math.sin(sunPulse) * 0.06;
      sunCore.scale.setScalar(pulse);

      planetData.forEach(({ mesh, meta }, i) => {
        mesh.userData.angle =
          (mesh.userData.angle || Math.random() * Math.PI * 2) +
          meta.speed * 0.01;
        const a = mesh.userData.angle;
        mesh.position.set(
          Math.cos(a) * meta.orbitR,
          0,
          Math.sin(a) * meta.orbitR,
        );
        mesh.rotation.y += 0.008 + i * 0.0025;
      });

      sunGroup.rotation.y += 0.0015;
      stars.rotation.y += 0.00004;
      nebula.rotation.y -= 0.00007;

      const mx = mouse.current.x * 0.6;
      const my = mouse.current.y * 0.4;
      camera.position.x = mx + Math.sin(t * 0.07) * 0.5;
      camera.position.y = 6 + Math.cos(t * 0.05) * 0.45 - my * 0.5;
      camera.lookAt(0, 0, 0);

      decorRing.rotation.z += 0.0003;

      renderer.render(scene, camera);
    };
    animate();

    const readyTimer = setTimeout(() => setReady(true), 100);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(readyTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      disposeScene(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setFading(true), 5000);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => onComplete?.(), 900);
    return () => clearTimeout(t);
  }, [fading, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      style={{
        width: "100%",
        height: "100dvh",
        minHeight: 600,
        overflow: "hidden",
        position: "relative",
        background: "#00010a",
        fontFamily: "'Courier New', 'Lucida Console', monospace",
      }}
    >
      <div
        ref={mountRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,1,10,0.7) 80%, rgba(0,1,10,0.92) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0.4,
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,200,255,0.025) 3px,rgba(0,200,255,0.025) 4px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 3,
          background:
            "linear-gradient(90deg, transparent 0%, #00e5ff 20%, #aa00ff 50%, #00e5ff 80%, transparent 100%)",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          zIndex: 3,
          background:
            "linear-gradient(90deg, transparent 0%, #7700ff 30%, #00ccff 60%, transparent 100%)",
          opacity: 0.4,
        }}
      />

      <AnimatePresence>
        {ready && !fading && (
          <motion.div
            key="ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {[
              {
                top: 20,
                left: 20,
                borderTop: "1px solid",
                borderLeft: "1px solid",
              },
              {
                top: 20,
                right: 20,
                borderTop: "1px solid",
                borderRight: "1px solid",
              },
              {
                bottom: 20,
                left: 20,
                borderBottom: "1px solid",
                borderLeft: "1px solid",
              },
              {
                bottom: 20,
                right: 20,
                borderBottom: "1px solid",
                borderRight: "1px solid",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                style={{
                  position: "absolute",
                  width: 28,
                  height: 28,
                  borderColor: "rgba(0,230,255,0.45)",
                  ...s,
                }}
              />
            ))}

            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9 }}
              style={{
                position: "absolute",
                top: 28,
                display: "flex",
                gap: 32,
                alignItems: "center",
                fontSize: 9,
                letterSpacing: "0.22em",
                color: "rgba(0,220,255,0.45)",
              }}
            >
              <span>SYS:ONLINE</span>
              <span>|</span>
              <span>ORBIT-NET v4.2.1</span>
              <span>|</span>
              <span>SECTOR: HELIO-7</span>
              <span>|</span>
              <span>LAT: 34.7°N · LON: 12.2°E</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.9 }}
              style={{
                position: "absolute",
                top: 60,
                right: 28,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {PLANETS.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.08, duration: 0.6 }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: Math.max(5, p.radius * 18),
                      height: Math.max(5, p.radius * 18),
                      borderRadius: "50%",
                      background: p.color,
                      boxShadow: `0 0 6px ${p.color}99`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 8,
                      color: "rgba(160,210,240,0.4)",
                      letterSpacing: "0.18em",
                    }}
                  >
                    {p.name.toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              style={{
                position: "relative",
                marginBottom: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  border: "1px solid rgba(0,220,255,0.25)",
                  borderTop: "1.5px solid rgba(0,220,255,0.7)",
                  borderRadius: "50%",
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  width: 74,
                  height: 74,
                  border: "1px solid rgba(180,100,255,0.2)",
                  borderBottom: "1.5px solid rgba(180,100,255,0.6)",
                  borderRadius: "50%",
                }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #ffe066, #ff8800)",
                  boxShadow: "0 0 18px #ff8800cc",
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.7, duration: 1.2, ease: "easeOut" }}
              style={{ textAlign: "center", marginBottom: 14 }}
            >
              <h1
                style={{
                  fontSize: "clamp(54px, 9vw, 96px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  margin: 0,
                  lineHeight: 1,
                  fontFamily: "'Courier New', monospace",
                  background:
                    "linear-gradient(135deg, #00eaff 0%, #ffffff 35%, #aa66ff 70%, #ff44aa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 20px rgba(0,200,255,0.35))",
                }}
              >
                ORBIT
              </h1>
              <div
                style={{
                  fontSize: "clamp(11px, 1.6vw, 15px)",
                  letterSpacing: "0.32em",
                  color: "rgba(180,220,255,0.55)",
                  fontWeight: 400,
                  marginTop: 8,
                  textTransform: "uppercase",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                Connect
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 1.0 }}
              style={{
                fontSize: "clamp(12px, 1.5vw, 15px)",
                color: "rgba(150,200,240,0.5)",
                letterSpacing: "0.12em",
                margin: "0 0 36px",
                textAlign: "center",
                maxWidth: 360,
                lineHeight: 1.7,
              }}
            >
              Connecting you to your digital universe
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#00ffaa",
                  boxShadow: "0 0 8px #00ffaa",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.28em",
                  color: flickOn
                    ? "rgba(0,255,170,0.7)"
                    : "rgba(0,255,170,0.15)",
                  textTransform: "uppercase",
                  transition: "color 0.05s",
                }}
              >
                WAITING FOR SIGNAL
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 3 }}
              style={{ marginTop: 28, width: 220, position: "relative" }}
            >
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.2em",
                  color: "rgba(0,200,255,0.35)",
                  marginBottom: 6,
                  textAlign: "right",
                }}
              >
                SCANNING NETWORK
              </div>
              <div
                style={{
                  width: "100%",
                  height: 1,
                  background: "rgba(0,200,255,0.15)",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1.0, duration: 4, ease: "linear" }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #00ccff, #aa44ff)",
                    borderRadius: 1,
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 1.0 }}
              style={{
                position: "absolute",
                bottom: 32,
                display: "flex",
                gap: 40,
                alignItems: "center",
              }}
            >
              {[
                { label: "NODES", value: "4,891" },
                { label: "LATENCY", value: "12ms" },
                { label: "UPTIME", value: "99.97%" },
                { label: "SIGNAL", value: "STRONG" },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 8,
                      color: "rgba(0,200,255,0.35)",
                      letterSpacing: "0.2em",
                      marginBottom: 3,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(180,230,255,0.65)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
