/**
 * StarWeaveLoginPage v2 — Cinematic redesign.
 * Less clutter. More presence.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StarWeaveAuth } from '..';
import { fetchChallenge } from '../engines/authIntegration';
import { useAuthStore } from '../../store/useAuthStore';
import { CyberAuthStyles, GlitchText, MorphInput } from '../../components/auth/CyberAuth';
import HoverBackButton from '../../components/common/HoverBackButton';

const MAIN_FONT = "'Outfit', sans-serif";
const INTER = "'Inter', sans-serif";

const C = {
  bg:      '#0a0a0f',
  primary: '#818cf8',
  indigo:  '#6366f1',
  muted:   'rgba(248, 250, 252, 0.6)',
  dim:     'rgba(248, 250, 252, 0.25)',
  error:   '#f87171',
};

// ── Animated background nebula canvas ─────────────────────────────────────────
function NebulaBg() {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x:  Math.random() * 100,
      y:  Math.random() * 100,
      sz: Math.random() * 2 + 0.5,
      op: Math.random() * 0.35 + 0.05,
      dur: 3 + Math.random() * 5,
      del: Math.random() * 6,
      hue: Math.random() > 0.8 ? C.cyan : '#fff',
    })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Nebula glows */}
      <div style={{
        position: 'absolute', top: '-20%', left: '30%', width: '50%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(0,229,255,0.04) 0%, transparent 70%)',
        borderRadius: '50%',
      }}/>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '20%', width: '40%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(181,96,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
      }}/>
      {/* Stars */}
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', top: `${s.y}%`, left: `${s.x}%`,
          width: s.sz, height: s.sz, background: s.hue, borderRadius: '50%',
          opacity: s.op, boxShadow: `0 0 ${s.sz * 3}px ${s.hue}`,
          animation: `sw-twinkle ${s.dur}s ${s.del}s infinite ease-in-out`,
        }} />
      ))}
      <style>{`
        @keyframes sw-twinkle {
          0%, 100% { opacity: var(--op, 0.15); transform: scale(1); }
          50% { opacity: calc(var(--op, 0.15) * 2.5); transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

// ── Animated SVG orbital icon ──────────────────────────────────────────────────
function LoginOrbit({ color }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame, a = 0;
    const loop = () => {
      a += 0.014;
      if (ref.current) {
        ref.current.querySelectorAll('.lo-ring').forEach((el, i) => {
          el.setAttribute('transform', `rotate(${(a + i * 1.2) * 57.3} 28 28)`);
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <svg ref={ref} width="56" height="56" viewBox="0 0 56 56" fill="none">
      <ellipse className="lo-ring" cx="28" cy="28" rx="24" ry="9"
        stroke={color} strokeWidth="1" opacity="0.6" strokeDasharray="5 3"/>
      <ellipse className="lo-ring" cx="28" cy="28" rx="24" ry="9"
        stroke={color} strokeWidth="0.6" opacity="0.3"
        transform="rotate(70 28 28)" strokeDasharray="2 6"/>
      <circle cx="28" cy="28" r="4" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
      <circle cx="28" cy="28" r="1.8" fill="#fff" opacity="0.95"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StarWeaveLoginPage() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const [email,    setEmail]   = useState(() => localStorage.getItem('starweave_email') || '');
  const [step,     setStep]    = useState('email');
  const [challengeData, setChallengeData] = useState(null);
  const [errorMsg, setErrorMsg]= useState('');
  const [focused,  setFocused] = useState(null);
  const [loading,  setLoading] = useState(false);
  const [enrolled, setEnrolled]= useState(false);

  useEffect(() => {
    if (searchParams.get('enrolled') === '1') setEnrolled(true);
  }, [searchParams]);

  const handleEmailSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMsg('Enter a valid email address');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const cData = await fetchChallenge(trimmed, 'starweave', 'login');
      setChallengeData(cData);
      setStep('gesture');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize session');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleAuthenticated = useCallback(() => {
    // Force a hard redirect to bypass any react-router race conditions
    // The main App component will run checkAuth on load anyway
    window.location.href = '/';
  }, []);

  const handleFailed = useCallback((reason) => {
    setStep('email');
    setEmail('');
    setErrorMsg(reason || 'Pattern not recognised — try again');
  }, []);

  // ── Gesture step ─────────────────────────────────────────────────────────────
  if (step === 'gesture') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: C.bg }}>
        <HoverBackButton onFire={() => setStep('email')} label="BACK TO EMAIL" />
        <StarWeaveAuth
          userId={email.trim()}
          onAuthenticated={handleAuthenticated}
          onFailed={handleFailed}
          forceMouse={false}
          challengeData={challengeData}
        />
        {/* Clean top - Title is now inside the Canvas HUD */}



        <style>{`@keyframes sw-hud-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    );
  }

  // ── Email entry ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MAIN_FONT,
    }}>
      <CyberAuthStyles/>
      <button 
        onClick={() => navigate('/login')}
        style={{
          position: 'absolute', top: 32, left: 32, zIndex: 100,
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontFamily: MAIN_FONT, fontSize: 13, cursor: 'pointer',
          letterSpacing: '0.05em', transition: 'color 0.2s', fontWeight: 500
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
      >
        ← BACK
      </button>
      <NebulaBg/>

      {/* Corner brackets */}
      {[
        { top: 28, left: 28, bt: true, bl: true },
        { top: 28, right: 28, bt: true, br: true },
        { bottom: 28, left: 28, bb: true, bl: true },
        { bottom: 28, right: 28, bb: true, br: true },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...Object.fromEntries(Object.entries(pos).filter(([k]) => ['top','bottom','left','right'].includes(k))),
          width: 36, height: 36,
          borderTop:    pos.bt ? `1px solid rgba(0,229,255,0.2)` : 'none',
          borderBottom: pos.bb ? `1px solid rgba(0,229,255,0.2)` : 'none',
          borderLeft:   pos.bl ? `1px solid rgba(0,229,255,0.2)` : 'none',
          borderRight:  pos.br ? `1px solid rgba(0,229,255,0.2)` : 'none',
        }}/>
      ))}

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(8,4,22,0.85)',
        border: '1px solid rgba(0,229,255,0.1)',
        borderRadius: 24, padding: '52px 48px 44px',
        width: '100%', maxWidth: 400,
        backdropFilter: 'blur(28px)',
        boxShadow: '0 0 100px rgba(0,229,255,0.04), 0 32px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Top shimmer line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
        }}/>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <LoginOrbit color={C.primary}/>
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: `${C.primary}80`, marginBottom: 10 }}>
            STARWEAVE AUTH
          </div>
          <h1 style={{
            fontFamily: MAIN_FONT, fontSize: 32, fontWeight: 700,
            color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            Welcome Back
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '10px 0 0', fontFamily: INTER }}>
            GESTURE CONSTELLATION AUTHENTICATION
          </p>
        </div>

        {/* Enrolled success banner */}
        {enrolled && (
          <div style={{
            background: 'rgba(129,140,248,0.1)',
            border: '1px solid rgba(129,140,248,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 22,
            color: C.primary, fontSize: 13, letterSpacing: '0.02em', lineHeight: 1.5,
            fontFamily: INTER,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ opacity: 0.8 }}>◎</span>
            Identity enrolled — trace your constellation to continue
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255,68,102,0.06)',
            border: '1px solid rgba(255,68,102,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 22,
            color: C.error, fontSize: 9, letterSpacing: '0.06em', lineHeight: 1.7,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ opacity: 0.6 }}>✕</span>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailSubmit}>
          <MorphInput
            label="Email Address"
            type="email"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            value={email}
            onChange={e => setEmail(e.target.value)}
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <button
            type="submit"
            disabled={loading}
            className="cyber-submit-btn"
            style={{
              marginTop: 20,
              background: loading
                ? 'rgba(0,229,255,0.08)'
                : 'linear-gradient(135deg, rgba(0,140,255,0.7) 0%, rgba(0,229,255,0.7) 100%)',
              boxShadow: loading ? 'none' : '0 0 24px rgba(0,229,255,0.12)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ position: 'relative', zIndex: 10 }}>
              {loading ? 'INITIALISING…' : 'INITIATE GESTURE CHALLENGE //'}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}/>
          <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.12)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}/>
        </div>

        {/* Alt auth links */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { to: '/login/constellation', label: 'CONSTELLATION', color: '139,92,246' },
            { to: '/login',              label: 'PASSWORD',       color: '148,163,184' },
          ].map(({ to, label, color }) => (
            <Link key={to} to={to} style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              borderRadius: 10,
              border: `1px solid rgba(${color},0.15)`,
              background: `rgba(${color},0.04)`,
              fontFamily: MAIN_FONT, fontSize: 8, letterSpacing: '0.14em',
              color: `rgba(${color},0.7)`,
              textDecoration: 'none',
              transition: 'all 0.22s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(${color},0.1)`; e.currentTarget.style.borderColor = `rgba(${color},0.4)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `rgba(${color},0.04)`; e.currentTarget.style.borderColor = `rgba(${color},0.15)`; }}
            >
              {label}
            </Link>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 8, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
          NEW?{' '}
          <Link to="/signup/starweave" style={{ color: C.cyan, textDecoration: 'none', fontWeight: 700 }}>
            ENROLL CONSTELLATION →
          </Link>
        </p>
      </div>
    </div>
  );
}
