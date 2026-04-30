/**
 * audioEngine v3 — Full Web Audio API synthesizer for StarWeave.
 *
 * Sounds (all synthesized, no audio files):
 *   hover()       — shimmer when cursor enters star zone
 *   select(n)     — rising pentatonic chime (nth note, 0-based)
 *   complete()    — verification fanfare arpeggio
 *   success()     — tri-chord resolution
 *   failure()     — descending dissonance
 *   reset()       — soft reset click

 *   setMuted(bool)
 *   getMuted()
 */

const A_MIN_PENT = [220, 277.18, 329.63, 415.30, 493.88, 554.37, 659.25];

let _ctx          = null;

let _isMuted      = false;
let _initialized  = false;

// ── AudioContext init (lazy, first interaction only) ─────────────────────────
function getCtx() {
  if (!_ctx || _ctx.state === 'closed') {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => { /* ignore */ });
  }
  return _ctx;
}

// ── Low-level tone ────────────────────────────────────────────────────────────
function tone({ frequency, duration, type = 'sine', gain = 0.13, attack = 0.008,
                decay = 0.06, sustain = 0.75, release = 0.12, detune = 0, delay = 0 }) {
  if (_isMuted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const t  = ctx.currentTime + delay;
  const osc  = ctx.createOscillator();
  const gn   = ctx.createGain();

  const bpf  = ctx.createBiquadFilter();
  bpf.type   = 'lowpass';
  bpf.frequency.value = 6000;

  osc.type            = type;
  osc.frequency.value = frequency;
  osc.detune.value    = detune;
  osc.connect(bpf);
  bpf.connect(gn);
  gn.connect(ctx.destination);

  const tA = t + attack;
  const tD = tA + decay;
  const tRS = Math.max(tD, t + duration - release);
  const tE  = Math.max(tRS, t + duration);

  gn.gain.setValueAtTime(0, t);
  gn.gain.linearRampToValueAtTime(gain, tA);
  gn.gain.linearRampToValueAtTime(gain * sustain, tD);
  gn.gain.setValueAtTime(gain * sustain, tRS);
  gn.gain.linearRampToValueAtTime(0, tE);

  osc.start(t);
  osc.stop(tE + 0.05);
}

function chord(freqs, duration, gain, delay = 0) {
  freqs.forEach(f => tone({ frequency: f, duration, gain, delay }));
}

// ── Public API ────────────────────────────────────────────────────────────────
export const audioEngine = {

  setMuted(m) { _isMuted = m; },
  getMuted()  { return _isMuted; },

  /** Call on first mousemove/touchstart to unlock AudioContext */
  init() {
    if (_initialized) return;
    _initialized = true;
    getCtx();
  },

  /** Subtler proximity shimmer */
  hover(proximity = 0.5) {
    const freq = 1800 + proximity * 400;
    tone({ frequency: freq, duration: 0.05, gain: proximity * 0.008, attack: 0.002,
           type: 'triangle', decay: 0.04, release: 0.01 });
  },

  /** 
   * Selection chime — "Woody" percussion logic.
   * Uses a triangle wave and a low-pass filter with resonance to simulate a block strike.
   */
  select(n = 0) {
    const fund = A_MIN_PENT[n % A_MIN_PENT.length];
    const ctx  = getCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const playHit = (freq, g, d, q = 3) => {
      const osc = ctx.createOscillator();
      const gn  = ctx.createGain();
      const lpf = ctx.createBiquadFilter();

      lpf.type = 'lowpass';
      lpf.frequency.value = freq * 1.5;
      lpf.Q.value = q;

      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      osc.connect(lpf);
      lpf.connect(gn);
      gn.connect(ctx.destination);

      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(g, t + 0.002);
      gn.gain.exponentialRampToValueAtTime(0.001, t + d);

      osc.start(t);
      osc.stop(t + d + 0.1);
    };

    // Primary block hit
    playHit(fund, 0.08, 0.35, 8);
    // Secondary "hollow" resonance 
    playHit(fund * 1.05, 0.04, 0.20, 12);
    // High-end "click" transient
    playHit(2200, 0.012, 0.04, 1);
  },

  /** Refined completion fanfare — more chime-like, less loud */
  complete() {
    const notes = [330, 415, 494, 622, 830];
    notes.forEach((f, i) => {
      const delay = i * 0.08;
      tone({ 
        frequency: f, duration: 0.8, gain: 0.05, type: 'sine', 
        attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5, delay 
      });
    });
  },

  /** Success resolution — soft and premium */
  success() {
    const g = 0.04;
    chord([523.25, 659.25, 783.99], 0.6, g, 0.00);
    chord([783.99, 987.77, 1318.5], 0.8, g * 0.8, 0.35);
  },

  /** Failure dissonance — less harsh */
  failure() {
    const notes = [220, 185, 140];
    notes.forEach((f, i) => {
      tone({ frequency: f, duration: 0.4, gain: 0.06,
             type: 'sine', attack: 0.02, decay: 0.1, release: 0.3, delay: i * 0.12 });
    });
  },

  /** Soft woody click */
  reset() {
    tone({ frequency: 440, duration: 0.05, gain: 0.03, type: 'triangle', attack: 0.002, decay: 0.02 });
  },


};
