/**
 * gestureEngine v7 — Ancient Rune Nodes + Biometric Rhythm Vector.
 *
 * Key v7 changes:
 *  • Entry grace period: cursor is ignored for 600ms after first entering frame
 *    (prevents the "hand enters view → instant accidental click" problem)
 *  • Magnetic attraction completely removed (was causing jump-to-node on entry)
 *  • DWELL_MS raised to 480ms — deliberate hover required to select
 *  • Smooth cursor alpha reduced so it doesn't snap violently on first frame
 *  • Commit zone: separate dwell tracking exposed via getCommitDwellProgress()
 */
import { GLYPH_NODES, STELLAR_GLYPHS } from './glyphEngine.js';

export { GLYPH_NODES, STELLAR_GLYPHS };
// Legacy aliases
export const EMOJI_NODES = GLYPH_NODES;
export const STAR_EMOJIS = GLYPH_NODES.map(n => n.label);

const DWELL_MS       = 480;   // ms of steady hover to select a node
const COOL_MS        = 380;   // post-selection cooldown (prevents double-fire)
const SNAP_R         = 62;    // px — node hitbox radius
const MAX_SPEED      = 0.0070;
const JITTER         = 0.018; // max ± position jitter per axis

// Entry grace: ignore all input for this many ms after cursor first appears
const ENTRY_GRACE_MS = 600;

export const MAX_AUTH_NODES = 9;
export const MIN_AUTH_NODES = 5;
export const MAX_AUTH_STARS = MAX_AUTH_NODES;
export const MIN_AUTH_STARS = MIN_AUTH_NODES;

// ─── Per-session deterministic jitter ─────────────────────────────────────────
function computeJitter(salt, index) {
  const jx = Math.sin((salt * 7919 + index * 1.37) * 2399.2) * 0.5 * JITTER;
  const jy = Math.cos((salt * 6173 + index * 2.11) * 3571.7) * 0.5 * JITTER;
  return { jx, jy };
}

// ─── Smooth cursor — Continuous 1-Euro Style Filter ─────────────────────────
function smoothCursor(rawX, rawY, prev) {
  const dist = Math.hypot(rawX - prev.smooth.x, rawY - prev.smooth.y);
  
  // Continuous dynamic alpha: Base of 0.35 (solid when still) scaling up to 0.92 (direct 1:1 follow)
  // Higher base alpha since the raw tracking already has its own stabilization.
  const alpha = Math.min(0.92, 0.35 + dist * 2.5);

  const vx = (rawX - prev.smooth.x) * alpha;
  const vy = (rawY - prev.smooth.y) * alpha;

  return {
    raw:      { x: rawX, y: rawY },
    smooth:   { x: prev.smooth.x + vx, y: prev.smooth.y + vy },
    velocity: { x: vx, y: vy },
    speed:    dist,
    isStable: dist < 0.0070, // MAX_SPEED
  };
}

export function buildCanonicalPattern(selectedNodes) {
  return selectedNodes.join(':');
}

export function buildSecurePattern(selectionData) {
  const { nodes, timingsMs, avgTimingMs, timingVariance, spatialCurvature, entryAngles } = selectionData;
  const nodeSeq  = nodes.join(':');
  const timingSig = avgTimingMs > 0 ? `T${Math.round(avgTimingMs / 50)}:${timingVariance < 100 ? 'S' : 'V'}` : '';
  const curveSig  = spatialCurvature > 0.001 ? `C${Math.round(spatialCurvature * 1000)}` : '';
  const angleSig  = entryAngles.length > 0 ? `A${entryAngles.map(a => Math.round(a / (Math.PI * 2 / 8)) % 8).join('')}` : '';
  return `${nodeSeq}#${timingSig}${curveSig}${angleSig}`.replace(/#$/, '');
}

export function createGestureEngine(
  { addSelectedStar, getSelectedStars, onHoverChange },
  W, H,
  sessionSalt = Math.random(),
  serverEmojiNodes = []
) {
  const nodesSource = serverEmojiNodes.length > 0 ? serverEmojiNodes : GLYPH_NODES;

  const nodes = nodesSource.map((def, i) => {
    const { jx, jy } = computeJitter(sessionSalt, i);
    const nx = Math.max(0.12, Math.min(0.88, def.baseX + jx));
    const ny = Math.max(0.12, Math.min(0.88, def.baseY + jy));
    return {
      id:    i,
      name:  def.label,
      emoji: def.emoji ?? null,
      hue:   def.hue ?? 270,
      isSignature: !!def.isSignature,
      nx, ny,
      px: nx * W,
      py: ny * H,
      phase:       Math.random() * Math.PI * 2,
      floatPhaseX: Math.random() * Math.PI * 2,
      floatPhaseY: Math.random() * Math.PI * 2 + 1.1,
    };
  });

  const stars = nodes;

  // Cursor state — initialized at center so first frame doesn't jump from (0,0)
  let cursorState = {
    raw:      { x: 0.5, y: 0.5 },
    smooth:   { x: 0.5, y: 0.5 },
    velocity: { x: 0, y: 0 },
    speed:    0,
    isStable: false,
  };

  let dwellStart      = null;
  let dwellNodeId     = null;
  let dwellProgress   = 0;
  let cooldownUntil   = 0;
  let lastHoverNodeId = null;
  let pinchActive     = false;

  // Entry grace — starts counting when cursor first appears
  let firstFrameAt   = null;    // timestamp of first valid frame
  let inGrace        = false;

  // Commit zone dwell (separate from node dwell)
  // The commit zone is a virtual circle at the center-bottom of the screen
  let commitDwellStart    = null;
  let commitDwellProgress = 0;
  const COMMIT_DWELL_MS   = 3000;

  // ── Biometric Rhythm Vector ──────────────────────────────────────────────────
  let selectionTimestamps  = [];
  let dwellDurations       = [];
  let entryAngles          = [];
  let flightProfiles       = [];
  let currentFlightSamples = [];
  let pathPoints           = [];
  let lastPathTime         = 0;
  let entryAnglePending    = null;

  function getNearestNode(nx, ny) {
    let nearest = null;
    let minPx   = Infinity;
    for (const node of nodes) {
      const dpx = Math.hypot((nx - node.nx) * W, (ny - node.ny) * H);
      if (dpx < minPx) { minPx = dpx; nearest = node; }
    }
    return minPx < SNAP_R ? nearest : null;
  }

  function tick(frame) {
    if (!frame) {
      cursorState = { ...cursorState, speed: 0, isStable: false };
      if (lastHoverNodeId !== null) { lastHoverNodeId = null; onHoverChange?.(null); }
      dwellNodeId = null; dwellProgress = 0; dwellStart = null;
      currentFlightSamples = [];
      // Reset grace timer — next appearance starts fresh
      firstFrameAt = null;
      inGrace = false;
      return;
    }

    const now = Date.now();

    // ── Entry grace period ────────────────────────────────────────────────────
    // On first frame after cursor appears, mark time and smooth to actual position
    if (firstFrameAt === null) {
      firstFrameAt = now;
      inGrace      = true;
      // Immediately warp the smooth cursor to where the hand actually is
      // so it doesn't slide in from center
      cursorState = {
        raw:      { x: frame.x, y: frame.y },
        smooth:   { x: frame.x, y: frame.y },
        velocity: { x: 0, y: 0 },
        speed:    0,
        isStable: false,
      };
      return; // skip selection logic for this frame entirely
    }

    if (inGrace) {
      if (now - firstFrameAt < ENTRY_GRACE_MS) {
        // During grace: update smooth position gently but suppress all selection
        cursorState = smoothCursor(frame.x, frame.y, cursorState);
        return;
      }
      inGrace = false; // grace period over
    }

    const selected    = getSelectedStars();
    const selectedIds = nodes.filter(n => selected.includes(n.name)).map(n => n.id);

    cursorState = smoothCursor(frame.x, frame.y, cursorState);

    // Path tracking
    if (now - lastPathTime > 45) {
      pathPoints.push({ x: frame.x, y: frame.y, z: frame.z ?? 0, t: now });
      if (pathPoints.length > 300) pathPoints.shift();
      lastPathTime = now;
    }

    currentFlightSamples.push(cursorState.speed);
    if (currentFlightSamples.length > 120) currentFlightSamples.shift();

    const { smooth } = cursorState;
    const nearest    = getNearestNode(smooth.x, smooth.y);

    // Entry angle detection
    for (const node of nodes) {
      if (selectedIds.includes(node.id)) continue;
      const dpx    = Math.hypot((smooth.x - node.nx) * W, (smooth.y - node.ny) * H);
      const entryR = SNAP_R * 1.5;
      if (dpx < entryR && entryAnglePending?.nodeId !== node.id) {
        entryAnglePending = { nodeId: node.id, angle: Math.atan2(node.ny - smooth.y, node.nx - smooth.x) };
      } else if (dpx >= entryR && entryAnglePending?.nodeId === node.id) {
        entryAnglePending = null;
      }
    }

    // Hover change
    const nearId = nearest?.id ?? null;
    if (nearId !== lastHoverNodeId) {
      lastHoverNodeId = nearId;
      onHoverChange?.(nearest?.name ?? null);
    }

    // Pinch shortcut (camera mode)
    if (frame.pinch && nearest && !selectedIds.includes(nearest.id) && now >= cooldownUntil) {
      if (!pinchActive) { pinchActive = true; _selectNode(nearest, selected, frame); }
    } else {
      pinchActive = false;
    }

    // Dwell selection
    if (selected.length >= MAX_AUTH_NODES) {
      dwellNodeId = null; dwellProgress = 0; dwellStart = null;
      return;
    }

    if (!nearest || selectedIds.includes(nearest.id) || now < cooldownUntil) {
      if (!nearest) { dwellNodeId = null; dwellProgress = 0; dwellStart = null; }
      return;
    }

    if (nearest.id !== dwellNodeId) {
      dwellNodeId = nearest.id;
      dwellStart  = now;
    }

    const elapsed = now - (dwellStart ?? now);
    dwellProgress = Math.min(1, elapsed / DWELL_MS);

    if (elapsed >= DWELL_MS) {
      _selectNode(nearest, selected, frame);
    }
  }

  function _selectNode(node, selected, frame = null) {
    const now   = Date.now();
    const added = addSelectedStar(node.name);
    if (!added) return;

    selectionTimestamps.push(now);
    dwellDurations.push(dwellStart ? now - dwellStart : 0);
    entryAngles.push(entryAnglePending?.nodeId === node.id ? entryAnglePending.angle : 0);
    entryAnglePending = null;
    flightProfiles.push([...currentFlightSamples]);
    currentFlightSamples = [];
    if (frame) pathPoints.push({ x: frame.x, y: frame.y, z: frame.z ?? 0, t: now });

    cooldownUntil = now + COOL_MS;
    dwellStart    = null;
    dwellNodeId   = null;
    dwellProgress = 0;
  }

  /**
   * tickCommitZone — call every frame when ≥5 stars selected.
   * cx, cy: normalized cursor position of the commit zone center.
   * Returns progress 0–1 (1 = ready to commit).
   */
  function tickCommitZone(cursorX, cursorY, zoneCx, zoneCy, zoneR) {
    if (cursorX == null) { commitDwellStart = null; commitDwellProgress = 0; return 0; }
    const dpx = Math.hypot((cursorX - zoneCx) * W, (cursorY - zoneCy) * H);
    const now  = Date.now();
    if (dpx < zoneR) {
      if (commitDwellStart === null) commitDwellStart = now;
      commitDwellProgress = Math.min(1, (now - commitDwellStart) / COMMIT_DWELL_MS);
    } else {
      commitDwellStart    = null;
      commitDwellProgress = 0;
    }
    return commitDwellProgress;
  }

  function getFrameState() {
    const { smooth, speed } = cursorState;
    return {
      cursor:        smooth.x === 0.5 && smooth.y === 0.5 && !firstFrameAt ? null : { x: smooth.x, y: smooth.y, speed },
      rawCursor:     cursorState.raw,
      dwellTarget:   dwellNodeId !== null ? (nodes.find(n => n.id === dwellNodeId)?.name ?? null) : null,
      dwellProgress,
      commitDwellProgress,
      cursorHue:     lastHoverNodeId !== null ? 180 : 270,
      isStable:      cursorState.isStable,
    };
  }

  function getMetrics() {
    const timingsMs = [];
    for (let i = 1; i < selectionTimestamps.length; i++) {
      timingsMs.push(selectionTimestamps[i] - selectionTimestamps[i - 1]);
    }
    const avgTimingMs    = timingsMs.length > 0 ? timingsMs.reduce((a, b) => a + b, 0) / timingsMs.length : 0;
    const timingVariance = timingsMs.length > 1
      ? Math.sqrt(timingsMs.map(t => (t - avgTimingMs) ** 2).reduce((a, b) => a + b, 0) / timingsMs.length) : 0;

    let spatialCurvature = 0;
    if (pathPoints.length >= 3) {
      let totalAngleChange = 0;
      for (let i = 1; i < pathPoints.length - 1; i++) {
        const v1 = { x: pathPoints[i].x - pathPoints[i-1].x, y: pathPoints[i].y - pathPoints[i-1].y };
        const v2 = { x: pathPoints[i+1].x - pathPoints[i].x,  y: pathPoints[i+1].y - pathPoints[i].y };
        totalAngleChange += Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y);
      }
      spatialCurvature = Math.abs(totalAngleChange) / pathPoints.length;
    }

    const flightVelocities = flightProfiles.map(s => s.length > 0 ? s.reduce((a, b) => a + b, 0) / s.length : 0);

    return {
      timingsMs, avgTimingMs, timingVariance, spatialCurvature,
      entryAngles, dwellDurations, flightVelocities, flightProfiles,
      pathPoints, selectionCount: selectionTimestamps.length,
    };
  }

  function onResize(newW, newH) {
    W = newW; H = newH;
    for (const node of nodes) { node.px = node.nx * W; node.py = node.ny * H; }
  }

  return { stars, nodes, tick, tickCommitZone, getFrameState, getMetrics, onResize };
}
