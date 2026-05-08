import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

export default function TetherApproval() {
  const [searchParams] = useSearchParams();
  const id    = searchParams.get('id');
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [isApproving, setIsApproving] = useState(false);

  const approve = async () => {
    setIsApproving(true);
    try {
      await axios.post(`${API_URL}/api/auth/ambient/tether/approve`, {
        tetherId: id,
        tetherToken: token
      });
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setIsApproving(false);
    }
  };

  const cs = {
    wrap: {
      width: '100vw', height: '100dvh', background: '#0a090f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Nunito', sans-serif"
    },
    card: {
      width: '100%', maxWidth: '380px', background: 'rgba(13,11,20,0.5)',
      borderRadius: '32px', border: '1px solid rgba(192,132,252,0.2)',
      padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      backdropFilter: 'blur(20px)', boxShadow: '0 20px 80px rgba(0,0,0,0.5)'
    },
    btn: (isApproving) => ({
      width: '100%', height: '80px', borderRadius: '40px', background: '#7c3aed',
      color: '#fff', fontSize: '20px', fontWeight: 900, border: 'none',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4)',
      opacity: isApproving ? 0.6 : 1, transition: 'all .2s ease'
    }),
    ring: {
      width: 120, height: 120, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px',
      border: '1px solid rgba(124, 58, 237, 0.3)', animation: 'pulse 2s infinite'
    }
  };

  if (!id || !token) return (
    <div style={cs.wrap}><div style={{ color: '#fb7185' }}>Invalid tether link.</div></div>
  );

  return (
    <div style={cs.wrap}>
      <div style={cs.card}>
        <div style={cs.ring}>{status === 'success' ? '✅' : '🛡️'}</div>
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', margin: '0 0 12px', fontSize: '24px', fontWeight: 900 }}>
             {status === 'success' ? 'Access Granted' : 'Orbit Identity'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
             {status === 'success' ? 'You have successfully signed in on your other device.' : 'Orbit wants to sign you in on a nearby desktop. Is this you?'}
          </p>
        </div>

        {status === 'pending' && (
          <button 
             onClick={approve} 
             disabled={isApproving}
             style={cs.btn(isApproving)}
          >
            {isApproving ? 'Granting…' : 'TAP TO SIGN IN'}
          </button>
        )}

        {status === 'success' && (
          <div style={{ color: '#4ade80', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '13px' }}>
             Identity Verified
          </div>
        )}

        {status === 'error' && (
          <div style={{ color: '#fb7185', fontWeight: 900, fontSize: '13px' }}>
             Handshake Failed. Link expired.
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
