/**
 * StarWeaveAuth v3 — Main orchestrator.
 *
 * Architecture:
 *  • 4-layer canvas stack (nebula/field/main/fx) managed here via refs
 *  • Object pools (particle/trail/shockwave) created once, passed to renderEngine
 *  • rAF loop reads engine state directly — NO React re-renders in hot path
 *  • AudioContext initialized on first interaction (browser policy)
 *  • Camera prompt → hand tracking OR silent fallback to mouse mode
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useStarWeaveStore }       from '../store/useStarWeaveStore';
import { initHandTracking, stopHandTracking } from '../engines/handTracking';
import { createGestureEngine, MAX_AUTH_NODES, buildCanonicalPattern, buildSecurePattern } from '../engines/gestureEngine';
import { createRenderEngine }      from '../engines/renderEngine';
import { createAntiSpoofEngine }   from '../engines/antiSpoofEngine';
import { fetchChallenge, submitAuth, submitStarWeaveLogin, AuthError } from '../engines/authIntegration';
import { audioEngine }             from '../audio/audioEngine';
import { createParticlePool }      from '../pools/particlePool';
import { createTrailPool }         from '../pools/trailPool';
import { createShockwavePool }     from '../pools/shockwavePool';
import { CameraPrompt, AuthResult } from './UIComponents';
import HoverBackButton from '../../components/common/HoverBackButton';

// Layer z-indices / styles
const LAYER_STYLE = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none',
};

export function StarWeaveAuth({ 
  userId, 
  onAuthenticated, 
  onFailed, 
  forceMouse = false,
  isSignup = false,
  isPractice = false,
  enrollPass = 1,
  ghostPattern = null,
  challengeData = null,
}) {
  // ── Canvas refs (4 layers) ────────────────────────────────────────────────
  const nebulaRef  = useRef(null);
  const fieldRef   = useRef(null);
  const mainRef    = useRef(null);
  const fxRef      = useRef(null);  // also captures mouse events below

  const videoRef     = useRef(null);
  const animRef      = useRef(null);
  const gestureRef   = useRef(null);
  const renderRef    = useRef(null);
  const antiSpoofRef = useRef(null);

  // Object pools — created once, never re-created
  const particlePoolRef  = useRef(null);
  const trailPoolRef     = useRef(null);
  const shockwavePoolRef = useRef(null);

  const selectTimesRef = useRef([]);
  const prevStarCount  = useRef(0);
  const authPending    = useRef(false);
  const sessionSalt    = useRef(Math.random());

  // ── Store ─────────────────────────────────────────────────────────────────
  const {
    phase, selectedStars, isMouseMode, antiSpoof,
    setPhase, setAntiSpoof, setMouseMode, setCameraActive,
    addSelectedStar, clearSelectedStars, setError, reset: resetStore,
  } = useStarWeaveStore();

  // ── Local state ───────────────────────────────────────────────────────────
  const [showPrompt,     setShowPrompt]     = useState(false);
  const [tracking,       setTracking]       = useState(false);
  const [initialising,   setInitialising]   = useState(false);
  const [authResult,     setAuthResult]     = useState(null);  // null | 'success' | 'failed'
  const [authInProgress, setAuthInProgress] = useState(false);
  const [mounted,        setMounted]        = useState(false);
  const [brightness,     setBrightness]     = useState(null);  // null | 'ok' | 'low'
  const [noHand,         setNoHand]         = useState(false);
  
  const instructionKey = isPractice ? 'practice' : (isSignup ? 'create' : 'login');
  const minStars = 5;

  // Commit dwell state (tracked in RAF loop — no React re-render)
  const commitDwellRef = useRef(0);   // 0–1 progress
  const commitDoneRef  = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // MOUNT
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    resetStore();
    requestAnimationFrame(() => setMounted(true));

    // Create object pools once
    particlePoolRef.current  = createParticlePool();
    trailPoolRef.current     = createTrailPool();
    shockwavePoolRef.current = createShockwavePool();

    if (forceMouse) {
      _beginSession(true);
    } else {
      setShowPrompt(true);
      setPhase('camera-prompt');
    }
    return () => _teardown();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Session startup
  // ─────────────────────────────────────────────────────────────────────────
  function _beginSession(mouseOnly) {
    const nebula = nebulaRef.current;
    const field  = fieldRef.current;
    const main   = mainRef.current;
    const fx     = fxRef.current;
    if (!nebula || !field || !main || !fx) return;

    setInitialising(true);
    const W = window.innerWidth;
    const H = window.innerHeight;
    [nebula, field, main, fx].forEach(c => { c.width = W; c.height = H; });

    gestureRef_init(W, H);

    renderRef.current = createRenderEngine(
      nebula, field, main, fx,
      particlePoolRef.current, trailPoolRef.current, shockwavePoolRef.current
    );
    antiSpoofRef.current = createAntiSpoofEngine();

    // RAF loop
    let noHandFrames = 0;
    let brightnessTimer = 0;

    let wasHoveringBackBtn = false;

    function loop() {
      animRef.current = requestAnimationFrame(loop);
      if (!gestureRef.current || !renderRef.current) return;

      noHandFrames++;
      brightCheckMaybe(++brightnessTimer);

      const { cursor, dwellTarget, dwellProgress, cursorHue } = gestureRef.current.getFrameState();
      const snap = useStarWeaveStore.getState();

      // Virtual DOM bridge for multiple overlay buttons
      if (cursor) {
        const cx = cursor.x * W;
        const cy = cursor.y * H;
        
        document.querySelectorAll('[data-sw-btn="true"]').forEach(btn => {
          const rect = btn.getBoundingClientRect();
          const isHovering = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
          const wasHovering = btn.dataset.isHovering === 'true';
          
          if (isHovering && !wasHovering) {
            btn.dataset.isHovering = 'true';
            btn.dispatchEvent(new Event('sw-btn-enter'));
          } else if (!isHovering && wasHovering) {
            btn.dataset.isHovering = 'false';
            btn.dispatchEvent(new Event('sw-btn-leave'));
          }
        });
      }

      // Dwell-to-commit zone: bottom-center, 80px radius
      // Only active when ≥ minStars selected and not verifying
      if (!authPending.current && snap.selectedStars.length >= minStars && cursor) {
        const prog = gestureRef.current.tickCommitZone(
          cursor.x, cursor.y,
          0.50,  // cx (normalized center-x)
          0.90,  // cy (normalized near-bottom)
          88,    // zone radius px
        );
        commitDwellRef.current = prog;
        if (prog >= 1 && !commitDoneRef.current) {
          commitDoneRef.current = true;
          _triggerAuth(snap.selectedStars);
        }
      } else {
        commitDwellRef.current = 0;
      }

      renderRef.current.renderFrame({
        stars:               gestureRef.current.stars,
        cursor:              cursor ? { ...cursor, hue: cursorHue } : null,
        selectedStars:       snap.selectedStars,
        dwellTarget,
        dwellProgress,
        isVerifying:         authPending.current,
        ghostPattern,
        commitZone:          snap.selectedStars.length >= minStars && !authPending.current
          ? { cx: 0.50, cy: 0.90, r: 88, progress: commitDwellRef.current }
          : null,
      });
    }
    loop();

    function brightCheckMaybe(frame) {
      if (frame % 90 !== 0 || !videoRef.current || mouseOnly) return;
      const lum = estimateBrightness(videoRef.current);
      if (lum > 0) setBrightness(lum < 35 ? 'low' : 'ok');
    }

    initHandTracking({
      videoElement: videoRef.current,
      forceMouse:   mouseOnly,
      onFrame: (frame) => {
        if (!frame) {
          // Hand lost
          return;
        }
        noHandFrames = 0;
        antiSpoofRef.current?.recordPosition(frame.x, frame.y, frame.z ?? 0);
        gestureRef.current?.tick(frame);
      },
      onLoaded: ({ mode }) => {
        setMouseMode(mode === 'mouse');
        setCameraActive(mode === 'camera');
        setPhase('tracking');
        setInitialising(false);
        setTracking(true);
        audioEngine.init();
      },
      onError: (err) => {
        const ignore = err?.message?.includes?.('gl_context') ||
                       err?.message?.includes?.('WebGL');
        if (!ignore) console.warn('[StarWeave]', err);
      },
    });

    // Mouse cursor tracking for mouse mode
    const onMouseMove = (e) => {
      const rect = fx.getBoundingClientRect();
      gestureRef.current?.tick({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        z: 0,
        pinch: false,
      });
      noHandFrames = 0;
      // Init audio on first mouse move
      audioEngine.init();
    };
    fx.style.pointerEvents = 'auto';
    fx.addEventListener('mousemove', onMouseMove);
    fx._cleanup = () => fx.removeEventListener('mousemove', onMouseMove);
  }

  function gestureRef_init(W, H) {
    gestureRef.current = createGestureEngine(
      {
        addSelectedStar:  (name) => useStarWeaveStore.getState().addSelectedStar(name),
        getSelectedStars: ()     => useStarWeaveStore.getState().selectedStars,
        onHoverChange: (starName) => {
          if (starName) audioEngine.hover(0.7);
        },
      },
      W, H,
      sessionSalt.current,
      challengeData?.emojiConfig || []
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Teardown
  // ─────────────────────────────────────────────────────────────────────────
  function _teardown() {
    cancelAnimationFrame(animRef.current);
    stopHandTracking();

    fxRef.current?._cleanup?.();
    gestureRef.current   = null;
    renderRef.current    = null;
    antiSpoofRef.current = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auth flow trigger
  // ─────────────────────────────────────────────────────────────────────────
  const _triggerAuth = useCallback(async (stars) => {
    if (authPending.current) return;
    authPending.current = true;
    setAuthInProgress(true);
    setPhase('verifying');

    audioEngine.complete();

    if (renderRef.current && gestureRef.current) {
      renderRef.current.triggerCompletionEffect(gestureRef.current.stars, stars);
    }

    // Build biometric metrics for this pass
    const gestureMetrics = gestureRef.current?.getMetrics() ?? {};
    const avgDwell = gestureMetrics.dwellDurations?.length
      ? gestureMetrics.dwellDurations.reduce((a, b) => a + b, 0) / gestureMetrics.dwellDurations.length
      : 0;
    const avgFlight = gestureMetrics.flightVelocities?.length
      ? gestureMetrics.flightVelocities.reduce((a, b) => a + b, 0) / gestureMetrics.flightVelocities.length
      : 0;
    const biometricVector = {
      selectedNodes:     stars,
      dwellDurations:    gestureMetrics.dwellDurations    ?? [],
      entryAngles:       gestureMetrics.entryAngles       ?? [],
      flightVelocities:  gestureMetrics.flightVelocities  ?? [],
      flightProfiles:    gestureMetrics.flightProfiles    ?? [],
      spatialCurvature:  gestureMetrics.spatialCurvature  ?? 0,
      avgDwellMs:        avgDwell,
      dwellVarianceMs:   0,
      avgFlightVelocity: avgFlight,
      flightVariance:    0,
      totalDurationMs:   selectTimesRef.current.length >= 2
        ? selectTimesRef.current[selectTimesRef.current.length - 1] - selectTimesRef.current[0]
        : 0,
      timingsMs:         gestureMetrics.timingsMs ?? [],
    };

    try {
      // ── SIGNUP MODE: bypass backend, return metrics to parent ────────────
      if (isSignup) {
        audioEngine.success();
        setAuthResult('success');
        setPhase('authenticated');
        setTimeout(() => {
          onAuthenticated?.(biometricVector);
        }, 900);
        return;
      }

      // ── LOGIN MODE: use native StarWeave endpoint ─────────────────────────
      const metrics = antiSpoofRef.current?.buildMetrics(selectTimesRef.current) ?? {};

      const res = await submitStarWeaveLogin({
        email:           userId,
        nodes:           stars,
        loginMetrics:    biometricVector,
        nonce:           challengeData?.nonce,
        emojiConfig:     challengeData?.emojiConfig,
        signatureGlyphs: challengeData?.signatureGlyphs,
        configSignature: challengeData?.configSignature
      });

      audioEngine.success();
      setAuthResult('success');
      setPhase('authenticated');

      setTimeout(async () => {
        try {
          const { useAuthStore } = await import('../../store/useAuthStore');
          const { axiosInstance } = await import('../../lib/axios');
          
          if (res?.user?.authToken) {
            // Set token in axios defaults FIRST so all subsequent requests are authenticated
            axiosInstance.defaults.headers.common["X-Auth-Token"] = res.user.authToken;
            
            // Set full auth state directly from login response — no need to call checkAuth
            useAuthStore.setState({ 
              authUser:    res.user,
              socketToken: res.user.authToken, 
              sessionId:   res.user.sessionId || useAuthStore.getState().sessionId,
              showPostAuthLoader: true,
            });
          }
          
          onAuthenticated?.(res?.user ?? useAuthStore.getState().authUser, biometricVector);
        } catch (e) {
          console.error('[StarWeaveAuth] Post-login sync failed:', e);
          onAuthenticated?.(null, biometricVector);
        }
      }, 1400);

    } catch (err) {
      audioEngine.failure();
      if (renderRef.current) renderRef.current.triggerFailure();
      const reason = err instanceof AuthError ? err.message : 'Authentication failed';
      setError(reason);
      setAuthResult('failed');
      setPhase('failed');
      setTimeout(() => { _resetAttempt(); onFailed?.(reason); }, 2600);
    }
  }, [userId, isSignup, onAuthenticated, onFailed, setPhase, setError, challengeData]);

  const _resetAttempt = useCallback(() => {
    authPending.current    = false;
    commitDoneRef.current  = false;
    commitDwellRef.current = 0;
    prevStarCount.current  = 0;
    selectTimesRef.current = [];
    antiSpoofRef.current?.reset();
    particlePoolRef.current?.reset();
    trailPoolRef.current?.reset();
    shockwavePoolRef.current?.reset();
    clearSelectedStars();
    setAuthResult(null);
    setAuthInProgress(false);
    sessionSalt.current = Math.random();
    audioEngine.reset();
    const isTracking = useStarWeaveStore.getState().phase === 'tracking';
    setPhase(isTracking ? 'tracking' : 'idle');
  }, [clearSelectedStars, setPhase]);

  // ─────────────────────────────────────────────────────────────────────────
  // React to selectedStars changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const count = selectedStars.length;
    if (count <= prevStarCount.current) return;

    const selectionIndex = count - 1;
    selectTimesRef.current.push(Date.now());
    antiSpoofRef.current?.recordSelection();
    audioEngine.select(selectionIndex);   // rising pentatonic pitch

    // Particle burst
    if (renderRef.current && gestureRef.current) {
      const name = selectedStars[count - 1];
      const star = gestureRef.current.stars.find(s => s.name === name);
      if (star) renderRef.current.emitParticles(star);
    }

    // Update anti-spoof display
    setAntiSpoof(antiSpoofRef.current?.evaluate() ?? {});

    prevStarCount.current = count;
  }, [selectedStars, setAntiSpoof]);

  // ─────────────────────────────────────────────────────────────────────────
  // Camera handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleCameraGrant = useCallback(() => { setShowPrompt(false); _beginSession(false); }, []);
  const handleCameraDeny  = useCallback(() => { setShowPrompt(false); _beginSession(true);  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Resize
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const W = window.innerWidth, H = window.innerHeight;
      [nebulaRef, fieldRef, mainRef, fxRef].forEach(ref => {
        if (ref.current) { ref.current.width = W; ref.current.height = H; }
      });
      renderRef.current?.onResize();
      gestureRef.current?.onResize(W, H);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Pass transitions (Signup)
  // ─────────────────────────────────────────────────────────────────────────
  const prevEnrollPass = useRef(enrollPass);
  useEffect(() => {
    if (enrollPass !== prevEnrollPass.current) {
      if (enrollPass === 2) {
        _resetAttempt();
      }
      prevEnrollPass.current = enrollPass;
    }
  }, [enrollPass, _resetAttempt]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        overflow:   'hidden',
        cursor:     showPrompt ? 'default' : 'none',
        opacity:    mounted ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Camera feed — very dim background */}
      <video
        ref={videoRef}
        data-starweave="true"
        autoPlay playsInline muted
        style={{
          position:      'absolute', inset: 0,
          width:         '100%', height: '100%',
          objectFit:     'cover',
          transform:     'scaleX(-1)',
          opacity:       tracking && !isMouseMode ? 0.06 : 0,
          transition:    'opacity 1.4s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 1 — static nebula */}
      <canvas ref={nebulaRef} style={{ ...LAYER_STYLE, zIndex: 1 }} />
      {/* Layer 2 — parallax field */}
      <canvas ref={fieldRef}  style={{ ...LAYER_STYLE, zIndex: 2 }} />
      {/* Layer 3 — stars + lines */}
      <canvas ref={mainRef}   style={{ ...LAYER_STYLE, zIndex: 3 }} />
      {/* Layer 4 — cursor + fx */}
      <canvas ref={fxRef}     style={{ ...LAYER_STYLE, zIndex: 4 }} />

      {/* Camera permission prompt — only overlay allowed */}
      {showPrompt && <CameraPrompt onGrant={handleCameraGrant} onDeny={handleCameraDeny} />}

      {/* Virtual Refresh Button */}
      {!showPrompt && (
        <HoverBackButton
          id="sw-refresh-btn"
          icon="⟳"
          label="CLEAR TRACE"
          firedLabel="CLEARING…"
          tooltipPosition="left"
          onFire={_resetAttempt}
          styleOverrides={{ top: 36, right: 36, left: 'auto' }}
        />
      )}

      {/* Auth result — only shown after completion */}
      {authResult && (
        <AuthResult
          result={authResult}
          behavioralScore={antiSpoofRef.current?.buildMetrics(selectTimesRef.current)?.score ?? 0}
          onReset={_resetAttempt}
        />
      )}
    </div>
  );
}

// ─── Brightness sampling ──────────────────────────────────────────────────────
function estimateBrightness(video) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d');
    ctx.drawImage(video, 0, 0, 32, 32);
    const d = ctx.getImageData(0, 0, 32, 32).data;
    let total = 0;
    for (let i = 0; i < d.length; i += 4) {
      total += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    }
    return total / (32 * 32);
  } catch { return -1; }
}
