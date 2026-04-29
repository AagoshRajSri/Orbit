import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useSoundManager } from '../hooks/useSoundManager';
import { CyberAuthStyles, GlitchText, MorphInput } from '../components/CyberAuth';
import { StarWeaveAuth } from '../starweave';
import { enrollStarWeave, fetchChallenge } from '../starweave/engines/authIntegration';
import HoverBackButton from '../components/HoverBackButton';

// Constants
const MAIN_FONT = "'Outfit', sans-serif";
const COL = {
  bg:      '#0a0a0f',
  surface: 'rgba(20, 20, 30, 0.8)',
  border:  'rgba(255, 255, 255, 0.1)',
  primary: '#818cf8', // Indigo
  accent:  '#6366f1',
  text:    '#f8fafc',
  muted:   'rgba(248, 250, 252, 0.6)',
  dim:     'rgba(248, 250, 252, 0.25)',
  error:   '#f87171'
};

const CARDS = [
  { 
    title: 'THE STELLAR CIPHER',
    body: 'Nine abstract runes orbit your constellation field. Each glyph is unique to Orbit — and hides a recognizable character within its geometry. One node will glow with your personal signature color.',
    icon: '⬡', accent: '#b560ff', hint: 'Select at least 5 glyphs'
  },
  {
    title: 'TRACE YOUR SEQUENCE',
    body: 'Move your cursor through the glowing runes in any order you choose. We capture not just the sequence — but the velocity, angles, and rhythm of your hand across each connection.',
    icon: '◈', accent: '#00e5ff', hint: 'Create a pattern only you would think of'
  },
  {
    title: 'BIOMETRIC LOCK',
    body: 'You will trace your cipher twice. The second pass confirms your sequence and allows the system to learn the precise tempo of your gesture — creating a living biometric fingerprint.',
    icon: '⌬', accent: '#ff00d0', hint: 'Consistency in order and rhythm is key'
  }
];

export default function StarWeaveSignupPage() {
  const navigate = useNavigate();
  const [step,       setStep]       = useState('identity');   // 'identity' → 'onboarding' → 'capture' → 'complete'
  const [cardIdx,    setCardIdx]    = useState(0);
  const [cardAnim,   setCardAnim]   = useState('in');
  const [formData,   setFormData]   = useState({ username: '', email: '', password: '' });
  const [focused,    setFocused]    = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [enrollPass, setEnrollPass] = useState(1);   // 1 → first draw, 2 → confirmation
  const [pass1Data,  setPass1Data]  = useState(null); // metrics from first gesture
  const [challengeData, setChallengeData] = useState(null);
  const [enrolling,  setEnrolling]  = useState(false);
  const [hov,        setHov]        = useState(null);
  // Password strength computation for visual feedback
  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "WEAK", "FAIR", "GOOD", "STRONG", "LETHAL"][pwStrength] || "";
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#a855f7"][pwStrength] || "";
  const { play } = useSoundManager();

  // ── Identity form ──────────────────────────────────────────────────────────
  const handleIdentitySubmit = useCallback((e) => {
    e.preventDefault();
    if (formData.username.length < 3) return setErrorMsg('Username must be at least 3 characters.');
    if (!formData.email.includes('@')) return setErrorMsg('Invalid email address.');
    if (formData.password.length < 8) return setErrorMsg('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(formData.password)) return setErrorMsg('Password must contain an uppercase letter.');
    if (!/[a-z]/.test(formData.password)) return setErrorMsg('Password must contain a lowercase letter.');
    if (!/[0-9]/.test(formData.password)) return setErrorMsg('Password must contain a number.');
    if (!/[^A-Za-z0-9]/.test(formData.password)) return setErrorMsg('Password must contain a special character.');
    setErrorMsg('');
    setStep('onboarding');
  }, [formData]);

  const goCard = async (dir) => {
    setCardAnim('out');

    const next = cardIdx + dir;
    let cData = challengeData;

    // Fetch the signed emoji layout before transitioning to the capture screen
    if (next >= CARDS.length && !cData) {
      try {
        cData = await fetchChallenge(formData.email.trim(), 'starweave', 'signup');
        setChallengeData(cData);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to initialize StarWeave canvas');
        setCardAnim('in');
        return;
      }
    }

    setTimeout(() => {
      if (next < 0) {
        setStep('identity');
        setCardIdx(0);
      } else if (next >= CARDS.length) {
        setStep('capture');
      } else {
        setCardIdx(next);
      }
      setCardAnim('in');
    }, 220);
  };

  // ── Enrollment pass 1 complete ─────────────────────────────────────────────
  const handlePass1Complete = useCallback((metrics) => {
    setPass1Data(metrics);
    setEnrollPass(2);
    // Stay in capture step, pass 2 logic will kick in
  }, []);

  // ── Enrollment pass 2 complete — submit to backend ─────────────────────────
  const handlePass2Complete = useCallback(async (metrics) => {
    if (!pass1Data || enrolling) return;

    // Verify pattern consistency between passes
    const p1 = pass1Data.selectedNodes.join(':');
    const p2 = metrics.selectedNodes.join(':');

    if (p1 !== p2) {
      setErrorMsg('Confirmation pass mismatch — the nodes must be selected in the exact same order.');
      setEnrollPass(1);
      setPass1Data(null);
      setStep('onboarding');
      setCardIdx(0);
      return;
    }

    setEnrolling(true);
    try {
      const res = await enrollStarWeave({
        username:       formData.username.trim(),
        email:         formData.email.trim(),
        password:      formData.password,
        nodes:         metrics.selectedNodes,
        pass1Metrics:  pass1Data,
        pass2Metrics:  metrics,
        nonce:           challengeData?.nonce,
        emojiConfig:     challengeData?.emojiConfig,
        signatureGlyphs: challengeData?.signatureGlyphs,
        configSignature: challengeData?.configSignature
      });
      
      // Inject token and state directly, bypassing the painful 3rd verification trace!
      const { useAuthStore } = await import('../store/useAuthStore');
      const { axiosInstance } = await import('../lib/axios');
      
      if (res?.user?.authToken) {
        axiosInstance.defaults.headers.common["X-Auth-Token"] = res.user.authToken;
        useAuthStore.setState({ 
          authUser:    res.user,
          socketToken: res.user.authToken, 
          sessionId:   res.user.sessionId || useAuthStore.getState().sessionId,
          showPostAuthLoader: true,
        });
      }

      setStep('complete');
    } catch (err) {
      console.error('[Signup] Enrollment failed with:', err.response?.data || err);
      // Show the precise exact message from the backend or Axios
      setErrorMsg(err.response?.data?.message || err.message || 'Enrollment failed.');
      setEnrolling(false);
      setStep('onboarding');
      setCardIdx(0);
    }
  }, [formData, pass1Data, enrolling, challengeData]);

  const handleVerificationComplete = useCallback((authUser) => {
    // Auth state is already set by StarWeaveAuth from the login response.
    // Navigate directly to the app.
    navigate('/');
  }, [navigate]);

  const handleEnrollFailed = (reason) => {
    if (step === 'verification') {
      setErrorMsg('Verification failed. Re-initiating authorization...');
      setStep('onboarding');
      setCardIdx(0);
      setEnrollPass(1);
      setPass1Data(null);
    } else if (enrollPass === 2) {
      setErrorMsg('Confirmation pattern did not match. Please trace your constellation again from the start.');
      setEnrollPass(1);
      setPass1Data(null);
      setStep('onboarding');
      setCardIdx(0);
    }
  };

  // ─── Renderers ─────────────────────────────────────────────────────────────
  
  // ─── Verification state (Prove you know it) ──────────────────────────────
  if (step === 'verification') {
    return (
      <div key="sw-verification" style={{ position: 'fixed', inset: 0, background: COL.bg }}>
        <HoverBackButton onFire={() => setStep('identity')} label="BACK TO FORM" />
        <StarWeaveAuth
          key="auth-verification"
          userId={formData.email.trim()}
          onAuthenticated={handleVerificationComplete}
          onFailed={handleEnrollFailed}
          challengeData={challengeData}
        />
      </div>
    );
  }

  // ─── Capture state ────────────────────────────────────────────────────────
  if (step === 'capture') {
    return (
      <div key="sw-capture" style={{ position: 'fixed', inset: 0, background: COL.bg }}>
        <HoverBackButton onFire={() => { setEnrollPass(1); setPass1Data(null); setStep('identity'); }} label="BACK TO FORM" />
        <StarWeaveAuth
          key={`auth-capture-pass-${enrollPass}`}
          isSignup
          enrollPass={enrollPass}
          ghostPattern={enrollPass === 2 ? pass1Data?.selectedNodes : null}
          onAuthenticated={enrollPass === 1 ? handlePass1Complete : handlePass2Complete}
          onFailed={handleEnrollFailed}
          onCancel={() => setStep('onboarding')}
          challengeData={challengeData}
        />
        {/* Clean center - HUD handles the title */}



        {enrolling && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textAlign: 'center'
          }}>
            <div style={{
              fontSize: 40, marginBottom: 24,
              animation: 'sw-icon-breathe 2s infinite ease-in-out',
              color: COL.primary
            }}>⬢</div>
            <div style={{ fontFamily: MAIN_FONT, fontSize: 14, letterSpacing: '0.4em', fontWeight: 800 }}>
              SECURING CONNECTIVITY //
            </div>
            <div style={{ fontFamily: MAIN_FONT, fontSize: 10, opacity: 0.5, marginTop: 12, letterSpacing: '0.1em' }}>
              CALIBRATING NEURAL SIGNATURE...
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Complete state ────────────────────────────────────────────────────────
  if (step === 'complete') {
    return <EnrollComplete username={formData.username} />;
  }

  // ─── Onboarding cards ─────────────────────────────────────────────────────
  if (step === 'onboarding') {
    return <InstructionCards
      cards={CARDS}
      cardIdx={cardIdx}
      cardAnim={cardAnim}
      onNext={() => goCard(1)}
      onBack={() => goCard(-1)}
      errorMsg={errorMsg}
    />;
  }

  // ─── Identity (default) ──────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#04020e',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      fontFamily: MAIN_FONT,
      overflowY: 'auto',
      padding: '24px 16px 64px',
    }}>
      <CyberAuthStyles />
      <button 
        onClick={() => window.location.href = '/login'}
        style={{
          position: 'absolute', top: 32, left: 32, zIndex: 100,
          background: 'none', border: 'none', color: 'rgba(0,229,255,0.6)',
          fontFamily: "'Orbitron', sans-serif", fontSize: 11, cursor: 'pointer',
          letterSpacing: '0.1em', transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,229,255,1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,229,255,0.6)'}
      >
        ← BACK TO LOGIN
      </button>
      <StarfieldBg />

      {/* Purple nebula glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(181,96,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }}/>

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
          borderTop:    pos.bt ? '1px solid rgba(181,96,255,0.2)' : 'none',
          borderBottom: pos.bb ? '1px solid rgba(181,96,255,0.2)' : 'none',
          borderLeft:   pos.bl ? '1px solid rgba(181,96,255,0.2)' : 'none',
          borderRight:  pos.br ? '1px solid rgba(181,96,255,0.2)' : 'none',
        }}/>
      ))}

      {/* Step rail */}
      <div style={{
        position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {['IDENTITY','LEARN','WEAVE','CONFIRM'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: i === 0 ? 20 : 6, height: 2, borderRadius: 1,
              background: i === 0 ? COL.primary : 'rgba(181,96,255,0.15)',
              transition: 'all 0.4s ease',
              boxShadow: i === 0 ? `0 0 8px ${COL.primary}` : 'none',
            }}/>
            {i < 3 && <div style={{ width: 1, height: 6, background: 'rgba(181,96,255,0.1)' }}/>}
          </div>
        ))}
        <span style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(181,96,255,0.4)', marginLeft: 4 }}>IDENTITY</span>
      </div>

      <div style={{
        position: 'relative', zIndex: 10,
        background: 'rgba(8,4,22,0.88)',
        border: '1px solid rgba(181,96,255,0.1)',
        borderRadius: 24, padding: '36px 40px 36px',
        width: '100%', maxWidth: 400,
        backdropFilter: 'blur(28px)',
        boxShadow: '0 0 100px rgba(181,96,255,0.04), 0 32px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        marginTop: 'auto', marginBottom: 'auto',
      }}>
        {/* Top shimmer */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(181,96,255,0.4), transparent)',
        }}/>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <SignupOrbitIcon color={COL.primary} size={48}/>
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.5em', color: `${COL.primary}80`, marginBottom: 8 }}>
            STARWEAVE ENROLLMENT
          </div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700,
            color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            Create Identity
          </h1>
          <p style={{ color: COL.muted, fontSize: 9, letterSpacing: '0.12em', margin: '8px 0 0' }}>
            GESTURE BIOMETRIC IDENTITY SYSTEM
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(255,68,102,0.06)', border: '1px solid rgba(255,68,102,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 22,
            color: '#ff4466', fontSize: 9, letterSpacing: '0.06em', lineHeight: 1.7,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ opacity: 0.6 }}>&#x2715;</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleIdentitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MorphInput
            label="Username"
            type="text"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            value={formData.username}
            onChange={e => setFormData(p => ({ ...p, username: e.target.value.replace(/\s+/g, '').toLowerCase() }))}
            focused={focused === 'username'}
            onFocus={() => setFocused('username')}
            onBlur={() => setFocused(null)}
          />

          <MorphInput
            label="Email Address"
            type="email"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            value={formData.email}
            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <div>
            <MorphInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
              value={formData.password}
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              focused={focused === 'password'}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            >
              <button
                type="button" tabIndex={-1}
                onClick={() => { play?.('click'); setShowPassword(!showPassword); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: showPassword ? '#b560ff' : 'rgba(255,255,255,0.25)',
                  transition: 'color 0.2s', position: 'relative', zIndex: 20,
                }}
              >
                <EyeOff style={{ width: 14, height: 14, display: showPassword ? 'block' : 'none' }}/>
                <Eye   style={{ width: 14, height: 14, display: showPassword ? 'none' : 'block' }}/>
              </button>
            </MorphInput>

            {/* Strength bar */}
            {formData.password && (
              <div style={{ marginTop: 8, padding: '0 2px' }}>
                <div style={{ display: 'flex', gap: 3, height: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, borderRadius: 1,
                      background: i <= pwStrength ? strengthColor : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.3s',
                      boxShadow: i <= pwStrength ? `0 0 4px ${strengthColor}60` : 'none',
                    }}/>
                  ))}
                </div>
                <p style={{ fontFamily: MAIN_FONT, fontSize: 8, letterSpacing: '0.16em', color: strengthColor, marginTop: 4, transition: 'color 0.3s' }}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="cyber-submit-btn"
            style={{ marginTop: 4 }}
          >
            <span style={{ position: 'relative', zIndex: 10 }}>CONTINUE → LEARN THE WEAVE</span>
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}/>
          <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.12)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}/>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { to: '/signup/constellation', label: 'CONSTELLATION', color: '139,92,246' },
            { to: '/signup',              label: 'STANDARD AUTH',  color: '148,163,184' },
          ].map(({ to, label, color }) => (
            <Link key={to} to={to} style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              borderRadius: 10,
              border: `1px solid rgba(${color},0.15)`,
              background: `rgba(${color},0.04)`,
              fontFamily: MAIN_FONT, fontSize: 8, letterSpacing: '0.14em',
              color: `rgba(${color},0.7)`,
              textDecoration: 'none', transition: 'all 0.22s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(${color},0.1)`; e.currentTarget.style.borderColor = `rgba(${color},0.4)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `rgba(${color},0.04)`; e.currentTarget.style.borderColor = `rgba(${color},0.15)`; }}
            >
              {label}
            </Link>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 8, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
          ALREADY ENROLLED?{' '}
          <Link to="/login/starweave" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 700 }}>
            AUTHENTICATE →
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Animated signup orbit icon ─────────────────────────────────────────────
function SignupOrbitIcon({ color, size = 56 }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame, a = 0;
    const loop = () => {
      a += 0.012;
      if (ref.current) {
        ref.current.querySelectorAll('.so-ring').forEach((el, i) => {
          el.setAttribute('transform', `rotate(${(a + i * 2.1) * 57.3} 28 28)`);
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse className="so-ring" cx="28" cy="28" rx="24" ry="9"
        stroke={color} strokeWidth="1" opacity="0.6" strokeDasharray="5 3"/>
      <ellipse className="so-ring" cx="28" cy="28" rx="24" ry="9"
        stroke={color} strokeWidth="0.6" opacity="0.25"
        transform="rotate(60 28 28)" strokeDasharray="2 6"/>
      <ellipse className="so-ring" cx="28" cy="28" rx="18" ry="6"
        stroke="#00e5ff" strokeWidth="0.5" opacity="0.2"
        transform="rotate(120 28 28)" strokeDasharray="3 4"/>
      <circle cx="28" cy="28" r="4.5" fill={color} style={{ filter: `drop-shadow(0 0 10px ${color})` }}/>
      <circle cx="28" cy="28" r="2" fill="#fff" opacity="0.95"/>
    </svg>
  );
}

// ─── Instruction Cards component ──────────────────────────────────────────────
function InstructionCards({ cards, cardIdx, cardAnim, onNext, onBack, errorMsg }) {
  const card = cards[cardIdx];
  const isLast = cardIdx === cards.length - 1;

  // Card-specific SVG icons
  const CardIcon = ({ card }) => {
    const icons = [
      // Card 0 — stellar cipher: hexagonal nodes
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" key="0">
        <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" stroke={card.accent} strokeWidth="1" fill="none" opacity="0.6"/>
        <polygon points="36,18 50,26 50,46 36,54 22,46 22,26" stroke={card.accent} strokeWidth="0.7" fill="none" opacity="0.3"/>
        <circle cx="36" cy="36" r="5" fill={card.accent} style={{ filter: `drop-shadow(0 0 8px ${card.accent})` }}/>
        {[[36,8],[58,20],[58,52],[36,64],[14,52],[14,20]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill={card.accent} opacity="0.7"/>
        ))}
      </svg>,
      // Card 1 — trace: flowing path
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" key="1">
        <path d="M12 60 C20 40 30 30 36 36 C42 42 52 20 60 12" stroke={card.accent} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8"/>
        {[[12,60],[36,36],[60,12]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill={card.accent} opacity={0.5 + i * 0.2} style={{ filter: `drop-shadow(0 0 6px ${card.accent})` }}/>
        ))}
        <circle cx="36" cy="36" r="7" stroke={card.accent} strokeWidth="0.8" fill="none" opacity="0.3"/>
      </svg>,
      // Card 2 — biometric lock: fingerprint-like arcs
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" key="2">
        {[10,14,18,22,26].map((r, i) => (
          <path key={i} d={`M${36-r} 36 A${r} ${r} 0 0 1 ${36+r} 36`} stroke={card.accent} strokeWidth="1" fill="none" opacity={0.2 + i * 0.12}/>
        ))}
        <path d="M26 52 C26 42 46 42 46 52" stroke={card.accent} strokeWidth="1" fill="none" opacity="0.5"/>
        <circle cx="36" cy="36" r="4" fill={card.accent} style={{ filter: `drop-shadow(0 0 10px ${card.accent})` }}/>
        <line x1="28" y1="28" x2="44" y2="44" stroke={card.accent} strokeWidth="0.5" opacity="0.2"/>
        <line x1="44" y1="28" x2="28" y2="44" stroke={card.accent} strokeWidth="0.5" opacity="0.2"/>
      </svg>,
    ];
    return icons[cardIdx] || icons[0];
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse 80% 70% at 50% 35%, rgba(40,0,100,0.15) 0%, #04020e 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MAIN_FONT,
    }}>
      <StarfieldBg dim />

      {/* Corner brackets */}
      {[
        { top: 32, left: 32, bt: true, bl: true },
        { top: 32, right: 32, bt: true, br: true },
        { bottom: 32, left: 32, bb: true, bl: true },
        { bottom: 32, right: 32, bb: true, br: true },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...Object.fromEntries(Object.entries(pos).filter(([k]) => ['top','bottom','left','right'].includes(k))),
          width: 28, height: 28,
          borderTop:    pos.bt ? `1px solid ${card.accent}25` : 'none',
          borderBottom: pos.bb ? `1px solid ${card.accent}25` : 'none',
          borderLeft:   pos.bl ? `1px solid ${card.accent}25` : 'none',
          borderRight:  pos.br ? `1px solid ${card.accent}25` : 'none',
          transition: 'border-color 0.4s',
        }}/>
      ))}

      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 460, padding: '0 24px',
      }}>
        {/* Step progress */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 48, alignItems: 'center' }}>
          {cards.map((_, i) => (
            <div key={i} style={{
              height: 2,
              width: i <= cardIdx ? 28 : 12,
              background: i <= cardIdx ? card.accent : 'rgba(255,255,255,0.08)',
              borderRadius: 1,
              transition: 'all 0.4s ease',
              boxShadow: i === cardIdx ? `0 0 8px ${card.accent}` : 'none',
            }}/>
          ))}
        </div>

        {/* Card */}
        <div style={{
          opacity:    cardAnim === 'in' ? 1 : 0,
          transform:  cardAnim === 'in' ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          background: 'rgba(12,6,28,0.75)',
          border: `1px solid ${card.accent}20`,
          borderRadius: 24, padding: '48px 36px 40px',
          backdropFilter: 'blur(20px)',
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 60px ${card.accent}08`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: `linear-gradient(90deg, transparent, ${card.accent}50, transparent)`,
          }}/>

          {/* Animated SVG icon */}
          <div style={{
            textAlign: 'center', marginBottom: 28,
            animation: 'sw-icon-breathe 2.5s ease-in-out infinite',
          }}>
            <CardIcon card={card}/>
          </div>

          {/* Step number + title */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 7, letterSpacing: '0.5em', color: `${card.accent}60`, marginBottom: 6 }}>
              STEP {cardIdx + 1} OF {cards.length}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, letterSpacing: '0.28em', color: card.accent,
              textShadow: `0 0 16px ${card.accent}40`,
            }}>
              {card.title}
            </div>
          </div>

          {/* Body */}
          <p style={{
            color: 'rgba(210,200,240,0.75)', fontSize: 13,
            lineHeight: 1.85, textAlign: 'center',
            marginBottom: 0, letterSpacing: '0.03em',
            maxWidth: 340, margin: '0 auto 24px',
          }}>
            {card.body}
          </p>

          {/* Hint */}
          <div style={{
            background: `${card.accent}08`,
            border: `1px solid ${card.accent}15`,
            borderRadius: 10, padding: '10px 16px',
            maxWidth: 320, margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: card.accent, flexShrink: 0, boxShadow: `0 0 6px ${card.accent}` }}/>
            <span style={{ color: 'rgba(210,200,240,0.6)', fontSize: 10, letterSpacing: '0.06em', lineHeight: 1.6 }}>
              {card.hint}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={onBack} style={{
            fontFamily: MAIN_FONT, fontSize: 9, letterSpacing: '0.2em',
            padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)', color: 'rgba(200,190,240,0.45)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(200,190,240,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(200,190,240,0.45)'; }}
          >
            ← BACK
          </button>
          <button onClick={onNext} style={{
            fontFamily: MAIN_FONT, fontSize: 9, letterSpacing: '0.2em',
            padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${card.accent}50`,
            background: `${card.accent}15`, color: card.accent,
            boxShadow: `0 0 20px ${card.accent}12`,
            transition: 'all 0.2s', fontWeight: 700,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${card.accent}25`; e.currentTarget.style.boxShadow = `0 0 30px ${card.accent}25`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${card.accent}15`; e.currentTarget.style.boxShadow = `0 0 20px ${card.accent}12`; }}
          >
            {isLast ? 'BEGIN WEAVE →' : 'NEXT →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sw-icon-breathe {
          0%, 100% { transform: scale(1) translateY(0); filter: brightness(1); }
          50%       { transform: scale(1.04) translateY(-2px); filter: brightness(1.15); }
        }
      `}</style>

      {errorMsg && (
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.25)',
          borderRadius: 20, padding: '8px 20px', color: '#ff8888', fontSize: 9,
          letterSpacing: '0.08em', zIndex: 100, backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}

// ─── Completion state component ────────────────────────────────────────────────
function EnrollComplete({ username }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MAIN_FONT, textAlign: 'center',
    }}>
      <StarfieldBg />
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 440, padding: '0 24px' }}>
        <div style={{
          fontSize: 80, color: COL.accent, marginBottom: 40,
          filter: 'drop-shadow(0 0 30px #00e5ff)',
        }}>⬢</div>
        <h1 style={{ color: '#fff', fontSize: 24, letterSpacing: '0.4em', fontWeight: 800 }}>IDENTITY ENROLLED</h1>
        <p style={{ color: COL.primary, fontSize: 13, letterSpacing: '0.12em', marginTop: 16, lineHeight: 1.6 }}>
          YOUR BIOMETRIC SIGNATURE HAS BEEN SECURED, {username?.toUpperCase()}.
        </p>

        <button
          onClick={() => navigate('/')}
          className="cyber-submit-btn"
          style={{ 
            marginTop: 48, 
            width: '100%', 
            background: 'linear-gradient(135deg, #0088ff 0%, #00f0ff 100%)',
            boxShadow: '0 0 30px rgba(0,240,255,0.2)'
          }}
        >
          <span style={{ position: 'relative', zIndex: 10 }}>ENTER ORBIT //</span>
        </button>

        <div style={{ 
          marginTop: 40, width: 40, height: 1, background: 'rgba(0,210,255,0.3)', 
          margin: '40px auto 0' 
        }} />
      </div>
    </div>
  );
}

// ─── Reusable background ──────────────────────────────────────────────────────
function StarfieldBg({ dim = false }) {
  const stars = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x:  Math.random() * 100,
      y:  Math.random() * 100,
      sz: Math.random() * 3,
      op: Math.random() * 0.5,
      dur: 2 + Math.random() * 4,
      del: Math.random() * 5
    })), []
  );

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      opacity: dim ? 0.4 : 1
    }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          top: `${s.y}%`,
          left: `${s.x}%`,
          width: s.sz,
          height: s.sz,
          background: '#fff',
          borderRadius: '50%',
          opacity: s.op,
          boxShadow: '0 0 10px #fff',
          animation: `sw-twinkle ${s.dur}s infinite ease-in-out`,
          animationDelay: `${s.del}s`
        }} />
      ))}
      <style>{`
        @keyframes sw-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function linkStyle(color) {
  return {
    color, fontSize: 10, letterSpacing: '0.1em', textDecoration: 'none',
    transition: 'color 0.2s',
  };
}