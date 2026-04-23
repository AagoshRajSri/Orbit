/**
 * handTracking — MediaPipe Hands wrapper + camera initialisation.
 *
 * Loads MediaPipe dynamically from CDN (no bundle cost).
 * Falls back to mouse/pointer tracking automatically on any failure.
 * Camera coordinates are un-mirrored before dispatch (natural hand position).
 */

// CDN URLs for MediaPipe — CSP must allow cdn.jsdelivr.net
const MP_HANDS_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
const MP_CAMERA_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js';

let _hands        = null;
let _camera       = null;
let _mouseCleanup = null;
let _videoElement = null; // explicit ref avoids querySelectorAll conflicts

// Suppress MediaPipe internal WebGL/console noise in production
// These are debug logs from MediaPipe's internal WASM/WebGL context
const _originalConsole = { ...console };
const _suppressMediaPipeLogs = () => {
  if (typeof window !== 'undefined') {
    // MediaPipe logs to console with specific prefixes - suppress these
    const suppressedPatterns = [
      'gl_context',
      'GL version',
      'OpenGL error',
      'I0000',
      'W0000',
      'hands_solution_simd_wasm',
      'gl_context_webgl',
    ];

    const shouldSuppress = (args) => {
      const msg = args.map(a => typeof a === 'string' ? a : (a?.toString?.() || '')).join(' ');
      return suppressedPatterns.some(p => msg.includes(p));
    };

    // Override to filter MediaPipe noise
    ['error', 'warn', 'info', 'log', 'debug'].forEach(method => {
      if (console[method]) {
        console[method] = (...args) => {
          if (!shouldSuppress(args)) {
            _originalConsole[method].apply(console, args);
          }
        };
      }
    });

    return () => {
      ['error', 'warn', 'info', 'log', 'debug'].forEach(method => {
        if (console[method] && _originalConsole[method]) {
          console[method] = _originalConsole[method];
        }
      });
    };
  }
  return () => {};
};

let _restoreConsole = null;

// ─── Script loader ─────────────────────────────────────────────────────────────
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    // Start suppressing logs before MediaPipe loads
    if (!_restoreConsole) {
      _restoreConsole = _suppressMediaPipeLogs();
    }
    const s    = document.createElement('script');
    s.src      = url;
    s.crossOrigin = 'anonymous';
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(s);
  });
}

// ─── Mouse / pointer fallback ─────────────────────────────────────────────────
function activateMouseFallback(onFrame) {
  const handler = (e) => {
    onFrame?.({
      x:          e.clientX / window.innerWidth,
      y:          e.clientY / window.innerHeight,
      z:          0,
      confidence: 1,
      landmarks:  null,
    });
  };
  window.addEventListener('mousemove',   handler, { passive: true });
  window.addEventListener('pointermove', handler, { passive: true });
  return () => {
    window.removeEventListener('mousemove',   handler);
    window.removeEventListener('pointermove', handler);
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * @param {Object}   opts
 * @param {HTMLVideoElement} opts.videoElement
 * @param {Function} opts.onFrame   — called with { x, y, z, confidence, landmarks } | null
 * @param {Function} opts.onLoaded  — called with { mode: 'camera'|'mouse', error? }
 * @param {Function} opts.onError   — called with Error on fatal failure
 * @param {boolean}  opts.forceMouse — skip camera entirely
 */
export async function initHandTracking({ videoElement, onFrame, onLoaded, onError, forceMouse = false }) {
  _videoElement = videoElement ?? null;

  if (forceMouse) {
    _mouseCleanup = activateMouseFallback(onFrame);
    onLoaded?.({ mode: 'mouse' });
    return;
  }

  try {
    // ── Request camera ─────────────────────────────────────────────────
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    if (videoElement) {
      videoElement.srcObject = stream;
      try {
        await videoElement.play();
      } catch (playErr) {
        console.warn('[StarWeave] Autoplay prevented:', playErr.message);
        // Continue — MediaPipe Camera will drive playback
      }
    }

    // ── Load MediaPipe from CDN ────────────────────────────────────────
    await Promise.all([loadScript(MP_HANDS_URL), loadScript(MP_CAMERA_URL)]);

    if (!window.Hands || !window.Camera) {
      throw new Error('MediaPipe globals not found after script load');
    }

    _hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });

    _hands.setOptions({
      maxNumHands:            1,
      modelComplexity:        1, /* Increased to 1 for better landmark stability vs 0 */
      minDetectionConfidence: 0.6,
      minTrackingConfidence:  0.7, /* More strict to avoid background noise jitter */
    });

    let _prevTracking = null;

    _hands.onResults((results) => {
      if (!results.multiHandLandmarks?.length) {
        onFrame?.(null);
        _prevTracking = null;
        return;
      }
      
      const lm = results.multiHandLandmarks[0];
      const tip = lm[8]; // INDEX_FINGER_TIP
      const confidence = results.multiHandedness?.[0]?.score ?? 0;

      // Ignore low confidence landmarks to prevent flickering
      if (confidence < 0.65) return;

      const rawX = 1 - tip.x;
      const rawY = tip.y;

      if (!_prevTracking) {
        _prevTracking = { x: rawX, y: rawY, time: Date.now() };
        return;
      }

      const now = Date.now();
      const dt = (now - _prevTracking.time) || 16;
      const dist = Math.hypot(rawX - _prevTracking.x, rawY - _prevTracking.y);
      
      // Jump Protection: 
      // If the hand "teleports" (e.g. lost/found cycle), ignore the frame to avoid a flicker-jump.
      // 0.25 normalized distance is equivalent to jumping 25% of the screen in < 30ms.
      if (dist > 0.25 && dt < 40) {
        return; 
      }

      // Proportional Smooth Filter:
      // High speed = follow raw. Stillness = lock position.
      const alpha = Math.min(0.9, 0.04 + dist * 6);
      const smoothX = _prevTracking.x + (rawX - _prevTracking.x) * alpha;
      const smoothY = _prevTracking.y + (rawY - _prevTracking.y) * alpha;

      _prevTracking = { x: smoothX, y: smoothY, time: now };

      // SENSITIVITY: 1.4 provides a comfortable reach while keeping center accurate.
      const SENSITIVITY = 1.4;
      
      onFrame?.({
        x:          0.5 + (smoothX - 0.5) * SENSITIVITY,
        y:          0.5 + (smoothY - 0.5) * SENSITIVITY,
        z:          tip.z,
        confidence,
        landmarks:  lm,
      });
    });

    _camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (!videoElement || !_hands) return;
        try {
          await _hands.send({ image: videoElement });
        } catch (sendErr) {
          console.warn('[StarWeave] MediaPipe send failed:', sendErr.message);
        }
      },
      width:  640,
      height: 480,
    });
    _camera.start();

    onLoaded?.({ mode: 'camera' });

  } catch (err) {
    console.warn('[StarWeave] Camera/MediaPipe unavailable, using mouse fallback:', err.message);
    _mouseCleanup = activateMouseFallback(onFrame);
    onLoaded?.({ mode: 'mouse', error: err.message });
  }
}

/**
 * Stop tracking and release all resources.
 */
export function stopHandTracking() {
  _mouseCleanup?.();
  _mouseCleanup = null;

  if (_camera) {
    try {
      _camera.stop();
    } catch (err) {
      console.warn('[StarWeave] Failed to stop camera:', err.message);
    }
    _camera = null;
  }

  if (_hands) {
    try {
      _hands.close();
    } catch (err) {
      console.warn('[StarWeave] Failed to close MediaPipe hands:', err.message);
    }
    _hands = null;
  }

  // Release the specific video element we were given (not a global query)
  if (_videoElement) {
    _videoElement.srcObject?.getTracks?.().forEach((t) => t.stop());
    _videoElement.srcObject = null;
    _videoElement = null;
  }

  // Restore original console methods
  if (_restoreConsole) {
    _restoreConsole();
    _restoreConsole = null;
  }
}
