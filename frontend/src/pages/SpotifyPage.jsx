import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music, LogOut, ChevronLeft, Loader } from "lucide-react";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { spotifyService } from "../services/spotifyService";
import SpotifyPlayer from "../components/spotify/SpotifyPlayer";
import SpotifySessionManager from "../components/spotify/SpotifySessionManager";
import { useBreakpoint, isMobileOrTablet } from "../lib/useBreakpoint";
import { BottomNav } from "../components/layout/BottomNav";

const CSS = `
  .spotify-root {
    min-height: 100dvh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  
  /* ── TOPBAR ── */
  .spotify-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    background: var(--topbar-bg, rgba(5,5,8,0.95));
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .spotify-topbar-left { display: flex; align-items: center; gap: 14px; }
  .spotify-back {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font); font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text2); padding: 7px 12px; border-radius: 6px;
    border: 1px solid var(--border); cursor: pointer;
    transition: all 0.2s;
  }
  .spotify-back:hover { color: var(--acc); border-color: var(--acc); }
  
  .spotify-brand { display: flex; align-items: center; gap: 10px; }
  .spotify-logo-box {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--acc2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    box-shadow: var(--shadow-acc); flex-shrink: 0;
  }
  .spotify-title {
    font-family: var(--font); font-size: 16px; font-weight: 800;
    color: var(--text); letter-spacing: 1px;
    white-space: nowrap;
  }
  .spotify-status {
    display: flex; align-items: center; gap: 6px; margin-top: 2px;
  }
  .spotify-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--acc); animation: orbit-pulse-glow 2s infinite;
  }
  .spotify-status-text {
    font-size: 9px; font-weight: 700; color: var(--text3);
    text-transform: uppercase; letter-spacing: 2px;
  }

  .spotify-topbar-right { display: flex; align-items: center; gap: 12px; }
  .spotify-session-btn {
    padding: 8px 14px; border-radius: 8px;
    background: transparent; border: 1px solid var(--border);
    color: var(--text2); font-family: var(--font);
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; cursor: pointer; transition: all 0.2s;
  }
  .spotify-session-btn.active { background: var(--acc2); color: white; border-color: var(--acc); }
  .spotify-user-info { display: flex; align-items: center; gap: 8px; }
  .spotify-user-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    border: 2px solid var(--border); object-fit: cover;
  }
  .spotify-user-text { line-height: 1.2; display: flex; flex-direction: column; }
  .spotify-user-name { font-size: 12px; font-weight: 700; color: var(--text); }
  .spotify-user-sub { font-size: 10px; color: var(--text3); }
  .spotify-logout {
    padding: 8px; border-radius: 8px; background: transparent;
    border: 1px solid var(--border); color: var(--text3); cursor: pointer;
    transition: all 0.2s;
  }
  .spotify-logout:hover { color: #ef4444; border-color: #ef4444; }

  /* ── BODY ── */
  .spotify-body {
    flex: 1; display: flex; min-height: 0; overflow: hidden;
  }
  .spotify-sidebar {
    width: 300px; background: var(--surface);
    border-right: 1px solid var(--border);
    flex-shrink: 0; overflow-y: auto; -webkit-overflow-scrolling: touch;
  }
  .spotify-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

  /* ── CONNECT SCREEN ── */
  .spotify-connect-wrap {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 32px; background: var(--bg);
  }
  .spotify-connect-card {
    text-align: center; max-width: 420px; padding: 48px;
    border-radius: var(--radius-lg); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    position: relative; overflow: hidden;
  }
  .spotify-connect-icon {
    width: 80px; height: 80px; border-radius: 24px; margin: 0 auto 24px;
    background: var(--acc2); display: flex; align-items: center; justify-content: center;
    box-shadow: var(--shadow-acc); color: white;
  }
  .spotify-connect-title {
    font-family: var(--font); font-size: 24px; font-weight: 800;
    color: var(--text); margin-bottom: 12px; letter-spacing: 1px;
  }
  .spotify-connect-desc {
    font-size: 14px; color: var(--text2); margin-bottom: 32px; line-height: 1.6;
  }
  .spotify-connect-btn {
    width: 100%; padding: 16px; border-radius: var(--radius);
    background: var(--acc); color: white; border: none;
    font-family: var(--font); font-size: 12px; font-weight: 800;
    letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
    box-shadow: var(--shadow-acc); transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .spotify-connect-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
  
  /* RESPONSIVE */
  @media (max-width: 768px) {
    .spotify-topbar { padding: 8px 14px; }
    .spotify-user-text { display: none; }
    .spotify-sidebar { position: absolute; top: 0; bottom: 0; right: 0; z-index: 40; box-shadow: -10px 0 30px rgba(0,0,0,0.5); }
    .spotify-title { font-size: 14px; }
  }
  @media (max-width: 480px) {
    .spotify-connect-card { padding: 32px 20px; }
    .spotify-body { padding-bottom: 80px; } /* BottomNav clearance */
  }
`;

function SpotifyLogo({ size = 22, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.352-.674.463-1.025.249-2.857-1.745-6.452-2.14-10.686-1.171-.403.092-.806-.162-.899-.565-.092-.402.162-.806.565-.898 4.636-1.06 8.607-.611 11.796 1.338.351.214.463.673.249 1.047zm1.467-3.257c-.271.442-.846.582-1.288.311-3.27-2.007-8.256-2.589-12.122-1.416-.499.151-1.023-.133-1.174-.633-.151-.499.133-1.023.633-1.174 4.417-1.34 9.909-.691 13.639 1.602.443.271.583.847.312 1.31zm.126-3.411c-3.922-2.329-10.395-2.545-14.153-1.405-.6.181-1.237-.161-1.418-.761-.181-.6.161-1.237.761-1.418 4.304-1.306 11.455-1.053 15.986 1.636.539.319.715 1.014.396 1.553-.319.539-1.014.715-1.572.395z" />
    </svg>
  );
}

export default function SpotifyPage() {
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const mobile = isMobileOrTablet(bp);
  const isMobileSize = bp === "mobile";

  const {
    isHost, spotifyProfile, setSpotifyProfile,
    spotifyLinked, disconnectSpotify, startPolling, stopPolling,
  } = useSpotifyStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSession, setShowSession] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!spotifyLinked) {
          const result = await spotifyService.getProfile();
          if (result?.linked) setSpotifyProfile(result.profile);
        }
      } catch (err) {
        console.error("Spotify init:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [spotifyLinked, setSpotifyProfile]);

  useEffect(() => {
    if (spotifyLinked) {
      startPolling();
      return () => stopPolling();
    }
  }, [spotifyLinked, startPolling, stopPolling]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await spotifyService.initiateLogin();
    } catch (err) {
      console.error("Spotify connect failed:", err);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Spotify from Orbit?")) return;
    try { await disconnectSpotify(); } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="spotify-root" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="orbit-spin" style={{width:40,height:40,border:'3px solid var(--acc)',borderTopColor:'transparent',borderRadius:'50%'}}></div></div>;

  return (
    <>
      <style>{CSS}</style>
      <div className="spotify-root">
        {/* TOPBAR */}
        <div className="spotify-topbar">
          <div className="spotify-topbar-left">
            <button className="spotify-back" onClick={() => navigate("/dreamland")}>◀ Hub</button>
            <div className="spotify-brand">
              <div className="spotify-logo-box"><SpotifyLogo size={20} color="white" /></div>
              <div>
                <div className="spotify-title">Orbit Sync</div>
                {spotifyLinked && (
                  <div className="spotify-status">
                    <div className="spotify-status-dot" />
                    <span className="spotify-status-text">{isHost ? "Host" : "Connected"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {spotifyLinked && (
            <div className="spotify-topbar-right">
              {isHost && (
                <button
                  className={`spotify-session-btn ${showSession ? "active" : ""}`}
                  onClick={() => setShowSession(s => !s)}
                >
                  Session
                </button>
              )}
              <div className="spotify-user-info">
                <img
                  src={spotifyProfile?.profileImage || \`https://ui-avatars.com/api/?name=\${spotifyProfile?.displayName || "U"}&background=1DB954&color=fff\`}
                  alt="Avatar"
                  className="spotify-user-avatar"
                />
                <div className="spotify-user-text">
                  <span className="spotify-user-name">{spotifyProfile?.displayName}</span>
                  <span className="spotify-user-sub">Spotify</span>
                </div>
              </div>
              <button className="spotify-logout" onClick={handleDisconnect} aria-label="Disconnect">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="spotify-body">
          <div className="spotify-main">
            {!spotifyLinked ? (
              <div className="spotify-connect-wrap">
                <div className="spotify-connect-card">
                  <div className="spotify-connect-icon"><SpotifyLogo size={40} color="white" /></div>
                  <h1 className="spotify-connect-title">Connect Spotify</h1>
                  <p className="spotify-connect-desc">Link your Spotify account to sync playback with others in the orbit.</p>
                  <button className="spotify-connect-btn" onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? <><Loader size={16} className="orbit-spin" /> Connecting...</> : <><SpotifyLogo size={16} color="white" /> Link Account</>}
                  </button>
                </div>
              </div>
            ) : (
              <SpotifyPlayer />
            )}
          </div>
          
          {spotifyLinked && isHost && showSession && (
            <div className="spotify-sidebar">
              <SpotifySessionManager />
            </div>
          )}
        </div>

        {isMobileSize && (
          <BottomNav active="spotify" onNavigate={tab => navigate(tab === "home" ? "/dreamland" : \`/\${tab}\`)} />
        )}
      </div>
    </>
  );
}
