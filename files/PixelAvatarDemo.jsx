// =============================================================================
// PixelAvatarDemo.jsx — Self-contained demo of the full pixel avatar system
//
// Shows: Chat panel + Studio panel + All-States grid
// No external deps — paste into any React project and render <PixelAvatarDemo />
//
// Assumes the PixelAvatar system files are at:
//   ./PixelAvatar/PixelAvatar.jsx
//   ./PixelAvatar/PixelAvatarBadge.jsx
//   ./PixelAvatar/useAvatarState.js
//   ./PixelAvatar/animation.js
//   ./PixelAvatar/renderer.js
//   ./PixelAvatar/sprites.js
// =============================================================================

import React, {
  useState, useRef, useCallback, useEffect, memo,
} from 'react';
import { PixelAvatar }    from './PixelAvatar/PixelAvatar.jsx';
import { PixelAvatarBadge } from './PixelAvatar/PixelAvatarBadge.jsx';
import { useAvatarState } from './PixelAvatar/useAvatarState.js';
import { ANIMAL_TYPES, AVATAR_STATES } from './PixelAvatar/sprites.js';

// ─── Palette / constants ────────────────────────────────────────────────────
const CONTACTS = [
  { id: 'dog',   name: 'Pixel',  animal: 'dog',   color: '#f2bc60' },
  { id: 'cat',   name: 'Mochi',  animal: 'cat',   color: '#b090d8' },
  { id: 'bunny', name: 'Boba',   animal: 'bunny', color: '#f8b4c0' },
];

const REPLIES = {
  dog:   ['woof! 🐾','tail is wagging!','*happy panting*','fetch?? fetch??','you are my fav ❤️','BALL!!'],
  cat:   ['hmm. adequate.','i was napping fyi','...fine 🐱','purring intensifies','very well then','*slow blink* 💜'],
  bunny: ['boing! 🐰','ears perked!','*nose twitch*','carrot? 🥕','hopping with joy!!','binky!!! ✨'],
};

const STATE_COLORS = {
  idle:     '#64748b', typing: '#6366f1', talking: '#06b6d4',
  happy:    '#ec4899', excited:'#f59e0b', sleeping:'#8b5cf6',
};

const tabs = ['💬 Chat', '🎨 Studio', '🔢 All States'];

// ─── Mini CSS-in-JS helpers ─────────────────────────────────────────────────
const row  = (extra = {}) => ({ display:'flex', alignItems:'center', ...extra });
const col  = (extra = {}) => ({ display:'flex', flexDirection:'column', ...extra });
const mono = { fontFamily:'monospace' };

// ─── Shared styles ──────────────────────────────────────────────────────────
const S = {
  root: {
    ...col(), background:'#0d1018', borderRadius:14,
    border:'0.5px solid rgba(255,255,255,0.1)',
    overflow:'hidden', minHeight:560, color:'#e8eaf0',
    ...mono,
  },
  nav: {
    ...row(), background:'#111520', borderBottom:'0.5px solid rgba(255,255,255,0.07)',
    height:40, padding:'0 10px', gap:2, flexShrink:0,
  },
  panel: { ...col(), flex:1, overflow:'hidden' },

  // Buttons
  tabBtn: (active) => ({
    ...mono, fontSize:10, fontWeight:700, letterSpacing:'.08em',
    textTransform:'uppercase', padding:'0 12px', height:40,
    display:'flex', alignItems:'center', cursor:'pointer', background:'none',
    border:'none', borderBottom: active ? '2px solid #5060f0' : '2px solid transparent',
    color: active ? '#e8eaf0' : '#4a5270', transition:'all .15s',
  }),

  smallBtn: (active, accent='#5060f0') => ({
    ...mono, fontSize:9, fontWeight:700, letterSpacing:'.06em',
    textTransform:'uppercase', padding:'5px 8px', borderRadius:6,
    background: active ? `${accent}22` : '#1a1e2e',
    border: `0.5px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
    color: active ? '#e8eaf0' : '#4a5270', cursor:'pointer', transition:'all .15s',
  }),

  input: {
    flex:1, background:'#0d1018', border:'0.5px solid rgba(255,255,255,0.10)',
    borderRadius:8, padding:'7px 12px', color:'#e8eaf0', ...mono, fontSize:11,
    outline:'none',
  },
  sendBtn: (enabled) => ({
    width:32, height:32, flexShrink:0, border:'none', borderRadius:8,
    cursor: enabled ? 'pointer' : 'default',
    background: enabled ? '#5060f0' : '#1a1e2e',
    color:'#fff', fontSize:13, display:'flex', alignItems:'center',
    justifyContent:'center', transition:'background .15s',
  }),
  bubble: (isMe) => ({
    padding:'7px 11px', borderRadius:10, fontSize:11, lineHeight:1.5,
    maxWidth:190, wordBreak:'break-word',
    background: isMe ? '#3730a3' : '#1a1e2e',
    color: isMe ? '#dde0ff' : '#e8eaf0',
    borderBottomLeftRadius: isMe ? 10 : 3,
    borderBottomRightRadius: isMe ? 3 : 10,
  }),
};

// ─── TypingIndicator ─────────────────────────────────────────────────────────
const TypingIndicator = memo(({ animal }) => (
  <div style={{ ...row(), gap:7, alignItems:'flex-end' }}>
    <PixelAvatar type={animal} state="typing" size={28} />
    <div style={{ ...row(), gap:3, padding:'8px 12px', background:'#1a1e2e',
        borderRadius:10, borderBottomLeftRadius:3 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:4, height:4, borderRadius:'50%', background:'#4a5270',
          animation:`tb 1s ${i*0.15}s infinite`,
        }} />
      ))}
    </div>
  </div>
));

// ─── MessageRow ──────────────────────────────────────────────────────────────
const MessageRow = memo(({ msg, peerAnimal, peerState }) => {
  const isMe = msg.from === 'me';
  return (
    <div style={{ ...row(), gap:7, flexDirection: isMe ? 'row-reverse' : 'row',
        animation:'msgIn .25s ease', alignItems:'flex-end' }}>
      {!isMe && <PixelAvatar type={peerAnimal} state={peerState} size={28} />}
      <div style={{ ...col(), alignItems: isMe ? 'flex-end' : 'flex-start', gap:2 }}>
        <div style={S.bubble(isMe)}>{msg.text}</div>
        <div style={{ fontSize:9, color:'#4a5270' }}>{msg.time}</div>
      </div>
    </div>
  );
});

// ─── ChatPanel ───────────────────────────────────────────────────────────────
function ChatPanel() {
  const [activeId, setActiveId]   = useState('dog');
  const [messages, setMessages]   = useState([
    { id:1, from:'dog',   text:"hey! tap the buttons to change my state 👆", time:'12:00 PM' },
    { id:2, from:'dog',   text:"or type a message to chat! 🐾",              time:'12:00 PM' },
  ]);
  const [typing, setTyping]       = useState(false);
  const [inputVal, setInputVal]   = useState('');
  const messagesRef               = useRef(null);
  const typingTimerRef            = useRef(null);
  const replyTimerRef             = useRef(null);

  // Per-contact avatar states
  const avatars = {
    dog:   useAvatarState('idle', { sleepAfter: 20000 }),
    cat:   useAvatarState('idle'),
    bunny: useAvatarState('sleeping'),
  };

  const selfAvatar  = useAvatarState('idle');
  const active      = CONTACTS.find(c => c.id === activeId);
  const peerAvatar  = avatars[activeId];

  const ts = () => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  const addMsg = useCallback((from, text) => {
    setMessages(prev => [...prev.slice(-30), { id: Date.now(), from, text, time: ts() }]);
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: 99999, behavior:'smooth' });
  }, [messages, typing]);

  const sendMsg = () => {
    const text = inputVal.trim();
    if (!text) return;
    setInputVal('');
    addMsg('me', text);
    selfAvatar.onMessageSent();
    peerAvatar.setState('happy');

    clearTimeout(replyTimerRef.current);
    setTimeout(() => {
      peerAvatar.setState('typing');
      setTyping(true);
      replyTimerRef.current = setTimeout(() => {
        setTyping(false);
        peerAvatar.onMessageReceived();
        const reps = REPLIES[activeId];
        addMsg(activeId, reps[Math.floor(Math.random() * reps.length)]);
      }, 1400 + Math.random() * 700);
    }, 600);
  };

  return (
    <div style={{ ...row(), flex:1, overflow:'hidden' }}>
      {/* Sidebar */}
      <div style={{ width:156, background:'#111520', borderRight:'0.5px solid rgba(255,255,255,0.07)',
          ...col(), flexShrink:0 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
            textTransform:'uppercase', padding:'10px 10px 6px' }}>Contacts</div>
        {CONTACTS.map(c => (
          <div key={c.id} onClick={() => setActiveId(c.id)}
              style={{ ...row(), gap:8, padding:'7px 10px', cursor:'pointer',
                background: c.id === activeId ? '#1a1e2e' : 'transparent',
                transition:'background .1s', position:'relative' }}>
            <PixelAvatarBadge type={c.animal} state={avatars[c.id].state} size={28}
              online={avatars[c.id].state !== 'sleeping'} />
            <div>
              <div style={{ fontSize:11, color:'#8892aa', fontWeight:600 }}>{c.name}</div>
              <div style={{ fontSize:9, color: STATE_COLORS[avatars[c.id].state] ?? '#4a5270', marginTop:1 }}>
                {avatars[c.id].state}
              </div>
            </div>
          </div>
        ))}

        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
            textTransform:'uppercase', padding:'10px 10px 6px', marginTop:4 }}>Quick</div>
        {['happy','excited','sleeping','idle'].map(s => (
          <button key={s} onClick={() => peerAvatar.setState(s)}
              style={{ ...S.smallBtn(false), margin:'2px 8px', textAlign:'left',
                width:'calc(100% - 16px)', display:'block' }}>
            {s === 'happy' ? '❤️' : s === 'excited' ? '⚡' : s === 'sleeping' ? '😴' : '😊'} {s}
          </button>
        ))}
      </div>

      {/* Main chat */}
      <div style={{ ...col(), flex:1, minWidth:0 }}>
        {/* Header */}
        <div style={{ ...row(), gap:10, padding:'8px 14px', background:'#161b28',
            borderBottom:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <PixelAvatarBadge type={active.animal} state={peerAvatar.state} size={34}
            online={peerAvatar.state !== 'sleeping'} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700 }}>{active.name}</div>
            <div style={{ fontSize:10, color: STATE_COLORS[peerAvatar.state], marginTop:1 }}>
              ● {peerAvatar.state}
            </div>
          </div>
          <div style={{ ...row(), gap:4 }}>
            {['typing','talking','happy','excited'].map(s => (
              <button key={s} onClick={() => peerAvatar.setState(s)}
                  style={S.smallBtn(peerAvatar.state === s, STATE_COLORS[s])}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesRef} style={{ flex:1, overflowY:'auto', padding:12,
            ...col(), gap:8, scrollbarWidth:'none' }}>
          {messages.map(m => (
            <MessageRow key={m.id} msg={m}
              peerAnimal={active.animal} peerState={peerAvatar.state} />
          ))}
          {typing && <TypingIndicator animal={active.animal} />}
        </div>

        {/* Input */}
        <div style={{ ...row(), gap:8, padding:'10px 12px', background:'#161b28',
            borderTop:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <PixelAvatar type="dog" state={selfAvatar.state} size={28} />
          <input
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); selfAvatar.onTyping(); }}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder={`message ${active.name}…`}
            style={S.input}
          />
          <button onClick={sendMsg} style={S.sendBtn(!!inputVal.trim())}>▶</button>
        </div>
      </div>
    </div>
  );
}

// ─── StudioPanel ─────────────────────────────────────────────────────────────
function StudioPanel() {
  const [animal, setAnimal] = useState('dog');
  const [state,  setState]  = useState('idle');
  const [size,   setSize]   = useState(64);
  const [speed,  setSpeed]  = useState(100);

  const snippet = `<PixelAvatar type="${animal}" state="${state}" size={${size}} />`;

  const copySnippet = () => {
    navigator.clipboard?.writeText(snippet).catch(() => {});
  };

  return (
    <div style={{ ...row(), flex:1, overflow:'hidden' }}>
      {/* Controls */}
      <div style={{ width:200, background:'#111520', borderRight:'0.5px solid rgba(255,255,255,0.07)',
          overflowY:'auto', flexShrink:0, scrollbarWidth:'none' }}>
        {/* Animal */}
        <div style={{ padding:12, borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
              textTransform:'uppercase', marginBottom:8 }}>Animal</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
            {ANIMAL_TYPES.map(a => (
              <button key={a} onClick={() => setAnimal(a)} style={S.smallBtn(animal === a)}>
                {a === 'dog' ? '🐶' : a === 'cat' ? '🐱' : '🐰'} {a}
              </button>
            ))}
          </div>
        </div>
        {/* State */}
        <div style={{ padding:12, borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
              textTransform:'uppercase', marginBottom:8 }}>State</div>
          <div style={{ ...col(), gap:3 }}>
            {AVATAR_STATES.map(s => (
              <button key={s} onClick={() => setState(s)}
                  style={{ ...S.smallBtn(state === s, STATE_COLORS[s]),
                    textAlign:'left', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%',
                    background: STATE_COLORS[s], display:'inline-block', flexShrink:0 }} />
                {s}
              </button>
            ))}
          </div>
        </div>
        {/* Size */}
        <div style={{ padding:12, borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
              textTransform:'uppercase', marginBottom:8 }}>Size</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
            {[32,48,64,96].map(sz => (
              <button key={sz} onClick={() => setSize(sz)} style={S.smallBtn(size === sz)}>
                {sz}px
              </button>
            ))}
          </div>
        </div>
        {/* Speed */}
        <div style={{ padding:12 }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
              textTransform:'uppercase', marginBottom:8 }}>
            Speed — {(speed / 100).toFixed(1)}×
          </div>
          <input type="range" min="25" max="300" value={speed}
            onChange={e => setSpeed(+e.target.value)}
            style={{ width:'100%', accentColor:'#5060f0', height:3 }} />
        </div>
      </div>

      {/* Preview */}
      <div style={{ ...col(), flex:1, background:'#0d1018' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', gap:12 }}>
          <PixelAvatar type={animal} state={state} size={size} speed={speed / 100} />
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#4a5270',
              textTransform:'uppercase' }}>
            {animal.toUpperCase()} · {state.toUpperCase()} · {size}px
          </div>
        </div>
        {/* Code snippet */}
        <div style={{ ...row(), gap:8, padding:'10px 14px', background:'#111520',
            borderTop:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <div style={{ flex:1, background:'#0d1018', border:'0.5px solid rgba(255,255,255,0.07)',
              borderRadius:6, padding:'6px 10px', fontSize:9, color:'#a5b4fc',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {snippet}
          </div>
          <button onClick={copySnippet}
              style={{ ...S.smallBtn(false), padding:'5px 12px' }}>
            COPY
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AllStatesGrid ────────────────────────────────────────────────────────────
function AllStatesGrid() {
  return (
    <div style={{ flex:1, overflow:'auto', padding:20, scrollbarWidth:'thin',
        scrollbarColor:'#1a1e2e transparent' }}>
      <div style={{ display:'grid',
          gridTemplateColumns: `80px repeat(${AVATAR_STATES.length}, 1fr)`,
          gap:2, maxWidth:600, margin:'0 auto' }}>
        {/* Header row */}
        <div />
        {AVATAR_STATES.map(s => (
          <div key={s} style={{ fontSize:8, fontWeight:700, letterSpacing:'.08em',
              textTransform:'uppercase', color: STATE_COLORS[s], textAlign:'center', padding:'4px 2px' }}>
            {s}
          </div>
        ))}
        {/* Animal rows */}
        {ANIMAL_TYPES.map(animal => (
          <React.Fragment key={animal}>
            <div style={{ ...row(), gap:5, fontSize:8, fontWeight:700, letterSpacing:'.08em',
                textTransform:'uppercase', color:'#4a5270', padding:'4px 4px', alignItems:'center' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', display:'inline-block',
                  background: animal === 'dog' ? '#f2bc60' : animal === 'cat' ? '#b090d8' : '#f8b4c0' }} />
              {animal}
            </div>
            {AVATAR_STATES.map(state => (
              <div key={state} style={{ ...col(), alignItems:'center', padding:'4px 2px', gap:3 }}>
                <PixelAvatar type={animal} state={state} size={40} />
                <div style={{ width:4, height:4, borderRadius:'50%',
                    background: STATE_COLORS[state] }} />
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Root Demo ───────────────────────────────────────────────────────────────
export function PixelAvatarDemo() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes tb { 0%,60%,100% { transform:translateY(0) } 30% { transform:translateY(-4px); background:#8892aa } }
      `}</style>

      <div style={S.root}>
        {/* Nav */}
        <div style={S.nav}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={S.tabBtn(activeTab === i)}>
              {t}
            </button>
          ))}
          <div style={{ flex:1 }} />
          <div style={{ fontSize:9, color:'#2a3050', letterSpacing:'.06em' }}>PIXEL AVT v2</div>
        </div>

        {/* Panels */}
        {activeTab === 0 && (
          <div style={{ ...S.panel, flexDirection:'row' }}><ChatPanel /></div>
        )}
        {activeTab === 1 && (
          <div style={{ ...S.panel, flexDirection:'row' }}><StudioPanel /></div>
        )}
        {activeTab === 2 && (
          <div style={{ ...S.panel }}><AllStatesGrid /></div>
        )}
      </div>
    </>
  );
}

export default PixelAvatarDemo;
