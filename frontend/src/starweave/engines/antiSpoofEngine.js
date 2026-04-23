/**
 * antiSpoofEngine — 5-signal liveness and replay protection.
 *
 * Signals:
 *   LIV  Liveness     — enough distinct cursor movement detected
 *   TMP  Temporal     — selection gaps are human-speed (not scripted)
 *   DPT  Depth        — z-axis varies (only relevant in camera mode)
 *   VAR  Variation    — micro-jitter present in motion stream
 *   AGG  Aggregate    → suspicionLevel + recommendation
 *
 * Advisory only — never blocks authentication on its own.
 * Results are forwarded to the backend as behavioral_metrics.
 */

const MIN_POSITION_CHANGES      = 6;    // distinct position deltas before liveness passes
const MIN_SELECTION_GAP_MS      = 280;  // less than this = suspiciously fast
const DEPTH_VAR_THRESHOLD       = 0.018;// z-axis RMS must exceed this in camera mode
const JITTER_THRESHOLD          = 0.0006; // avg per-frame delta in x/y
const POSITION_DELTA_MIN        = 0.0015; // min delta to count as a "change"
const HISTORY_SIZE              = 40;    // rolling window

export function createAntiSpoofEngine() {
  // Rolling position histories
  const positions    = [];   // { x, y, t }
  const zValues      = [];   // number
  const selectTimes  = [];   // ms timestamps of each selection

  let posChanges = 0;        // count of meaningful position deltas

  // ─── Record a tracking frame ─────────────────────────────────────────────
  function recordPosition(x, y, z) {
    const now = Date.now();

    // Rolling position window
    positions.push({ x, y, t: now });
    if (positions.length > HISTORY_SIZE) positions.shift();

    // Depth window (camera mode only; z === 0 in mouse mode)
    if (z !== 0 && z != null) {
      zValues.push(z);
      if (zValues.length > HISTORY_SIZE) zValues.shift();
    }

    // Count meaningful movements
    if (positions.length >= 2) {
      const prev = positions[positions.length - 2];
      const curr = positions[positions.length - 1];
      const d    = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      if (d > POSITION_DELTA_MIN) posChanges++;
    }
  }

  // ─── Record a star selection ─────────────────────────────────────────────
  function recordSelection() {
    selectTimes.push(Date.now());
  }

  // ─── Evaluate all signals ─────────────────────────────────────────────────
  function evaluate() {
    // Signal 1 — Liveness
    const liveness = posChanges >= MIN_POSITION_CHANGES;

    // Signal 2 — Temporal gaps between selections
    let temporal = true;
    for (let i = 1; i < selectTimes.length; i++) {
      if (selectTimes[i] - selectTimes[i - 1] < MIN_SELECTION_GAP_MS) {
        temporal = false;
        break;
      }
    }

    // Signal 3 — Depth variation (z-axis)
    let depth = true; // passes by default in mouse mode
    if (zValues.length >= 8) {
      const mean = zValues.reduce((a, b) => a + b, 0) / zValues.length;
      const rms  = Math.sqrt(zValues.reduce((a, z) => a + (z - mean) ** 2, 0) / zValues.length);
      depth = rms > DEPTH_VAR_THRESHOLD;
    }

    // Signal 4 — Micro-jitter (natural hand tremor / natural mouse movement)
    let patternVariation = false;
    if (positions.length >= 10) {
      let totalDelta = 0;
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x;
        const dy = positions[i].y - positions[i - 1].y;
        totalDelta += Math.sqrt(dx * dx + dy * dy);
      }
      patternVariation = (totalDelta / (positions.length - 1)) > JITTER_THRESHOLD;
    }

    // Signal 5 — Aggregate suspicion level
    const fails = [liveness, temporal, depth, patternVariation].filter(v => !v).length;
    let suspicionLevel  = 'none';
    let recommendation  = 'allow';

    if (fails >= 3)       { suspicionLevel = 'high';   recommendation = 'review';   }
    else if (fails === 2) { suspicionLevel = 'medium';  recommendation = 'monitor';  }
    else if (fails === 1) { suspicionLevel = 'low';     recommendation = 'allow';    }

    return { liveness, temporal, depth, patternVariation, suspicionLevel, recommendation };
  }

  // ─── Build behavioral score (0-100) ─────────────────────────────────────
  function computeScore(antiSpoofResult) {
    let score = 100;
    if (!antiSpoofResult.liveness)          score -= 25;
    if (!antiSpoofResult.temporal)          score -= 20;
    if (!antiSpoofResult.depth)             score -= 15;
    if (!antiSpoofResult.patternVariation)  score -= 15;
    return Math.max(0, score);
  }

  // ─── Compute average velocity (px/s rough, normalised) ──────────────────
  function computeAvgVelocity() {
    if (positions.length < 2) return 0;
    const first = positions[0];
    const last  = positions[positions.length - 1];
    const dt    = (last.t - first.t) / 1000;
    if (dt <= 0) return 0;
    const dx    = last.x - first.x;
    const dy    = last.y - first.y;
    return Math.sqrt(dx * dx + dy * dy) / dt;
  }

  // ─── Build full metrics payload ──────────────────────────────────────────
  function buildMetrics(selectionTimestamps) {
    const antiSpoofResult = evaluate();
    const score           = computeScore(antiSpoofResult);
    const avgVelocity     = computeAvgVelocity();

    const timingsMs = [];
    for (let i = 1; i < selectionTimestamps.length; i++) {
      timingsMs.push(selectionTimestamps[i] - selectionTimestamps[i - 1]);
    }

    // RMS of jitter
    let jitterRms = 0;
    if (positions.length >= 2) {
      const deltas = [];
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x;
        const dy = positions[i].y - positions[i - 1].y;
        deltas.push(dx * dx + dy * dy);
      }
      jitterRms = Math.sqrt(deltas.reduce((a, b) => a + b, 0) / deltas.length);
    }

    return {
      score,
      timingsMs,
      avgVelocity,
      jitterRms,
      antiSpoof: {
        ...antiSpoofResult,
        clientVersion: '3.0.0',
      },
    };
  }

  function reset() {
    positions.length   = 0;
    zValues.length     = 0;
    selectTimes.length = 0;
    posChanges         = 0;
  }

  return { recordPosition, recordSelection, evaluate, buildMetrics, reset };
}
