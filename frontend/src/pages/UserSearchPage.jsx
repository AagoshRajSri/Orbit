/**
 * USER SEARCH / DISCOVERY PAGE
 * Find and connect with other Orbit users.
 * Vampire theme + responsive per foundation breakpoints.
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBreakpoint, isMobileOrTablet } from "../lib/useBreakpoint";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { BottomNav } from "../components/layout/BottomNav";

const CSS = `
  .search-root {
    min-height: 100dvh;
    background: var(--bg, #050508);
    color: var(--text, #F0E6D3);
    font-family: var(--font-body, sans-serif);
    display: flex; flex-direction: column;
  }

  /* TOP BAR */
  .search-topbar {
    position: sticky; top: 0; z-index: 30;
    display: flex; align-items: center; gap: 12px;
    padding: 0 24px; height: 60px;
    background: rgba(5,5,8,0.97);
    border-bottom: 1px solid var(--border, rgba(139,0,0,0.25));
    backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .search-back {
    font-family: var(--font, 'Cinzel',serif); font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text2); padding: 7px 12px; border-radius: 6px;
    border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
    flex-shrink: 0;
  }
  .search-back:hover { color: var(--acc); border-color: var(--acc); }
  .search-title {
    font-family: var(--font, 'Cinzel',serif); font-size: 16px;
    font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    flex: 1;
  }

  /* SEARCH INPUT */
  .search-bar-wrap {
    padding: 16px 24px;
    background: var(--surface, #0F0F18);
    border-bottom: 1px solid var(--border-soft);
    flex-shrink: 0;
  }
  .search-input-row {
    display: flex; align-items: center; gap: 10px;
    background: var(--input-bg, rgba(10,10,16,0.7));
    border: 1px solid var(--border);
    border-radius: 12px; padding: 10px 16px;
    transition: border-color 0.2s;
  }
  .search-input-row:focus-within { border-color: var(--acc); }
  .search-icon { font-size: 16px; opacity: 0.5; flex-shrink: 0; }
  .search-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px;
    font-family: var(--font-body, sans-serif);
  }
  .search-input::placeholder { color: var(--text3); }
  .search-clear {
    font-size: 16px; opacity: 0.4; cursor: pointer;
    transition: opacity 0.2s;
  }
  .search-clear:hover { opacity: 0.8; }

  /* RESULTS */
  .search-results {
    flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: 8px 0;
  }
  .search-section-label {
    font-family: var(--font,'Cinzel',serif); font-size: 9px;
    font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    color: var(--text3); padding: 12px 24px 6px;
  }
  .search-user-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 24px; cursor: pointer;
    border-bottom: 1px solid var(--border-soft);
    transition: background 0.18s;
    animation: orbit-fade-up .22s ease both;
  }
  .search-user-row:hover { background: rgba(139,0,0,0.05); }
  .search-user-avatar {
    width: 46px; height: 46px; border-radius: 50%;
    background: var(--surface2, #141420);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0; overflow: hidden;
    position: relative;
  }
  .search-user-online {
    position: absolute; bottom: 2px; right: 2px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #22c55e;
    border: 2px solid var(--bg);
    box-shadow: 0 0 6px rgba(34,197,94,0.6);
  }
  .search-user-info { flex: 1; min-width: 0; }
  .search-user-name {
    font-family: var(--font,'Cinzel',serif); font-size: 13px;
    font-weight: 700; letter-spacing: 1px; color: var(--text);
  }
  .search-user-sub {
    font-size: 12px; color: var(--text3); font-style: italic;
  }
  .search-user-action {
    font-family: var(--font); font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    padding: 6px 14px; border-radius: 8px;
    border: 1px solid var(--border); color: var(--text2);
    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  .search-user-action:hover { border-color: var(--acc); color: var(--acc); }
  .search-user-action.added { border-color: var(--acc2); color: var(--acc2); }
  .search-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    padding: 60px 32px; opacity: 0.4;
    font-style: italic; font-size: 14px; text-align: center;
  }

  /* RESPONSIVE */
  @media (max-width: 480px) {
    .search-topbar  { padding: 0 14px; }
    .search-bar-wrap{ padding: 12px 14px; }
    .search-user-row{ padding: 10px 14px; }
    .search-results { padding-bottom: 80px; }
  }
  @media (min-width: 1025px) {
    .search-results { max-width: 720px; margin: 0 auto; }
  }
`;

export default function UserSearchPage() {
  const navigate      = useNavigate();
  const bp            = useBreakpoint();
  const mobile        = isMobileOrTablet(bp);
  const [q, setQ]     = useState("");
  const inputRef      = useRef(null);

  const allUsers     = useChatStore((s) => s.users);
  const contactList  = useChatStore((s) => s.contactList);
  const addContact   = useChatStore((s) => s.addContact);
  const authUser     = useAuthStore((s) => s.authUser);
  const onlineUsers  = useAuthStore((s) => s.onlineUsers);

  const filtered = (q.trim().length >= 1)
    ? allUsers.filter((u) =>
        u._id !== authUser?._id &&
        (u.username?.toLowerCase().includes(q.toLowerCase()) ||
         u.email?.toLowerCase().includes(q.toLowerCase()))
      )
    : allUsers.filter((u) => u._id !== authUser?._id).slice(0, 20);

  const isOnline = (id) => onlineUsers?.includes(id?.toString());

  return (
    <>
      <style>{CSS}</style>
      <div className="search-root">
        {/* TOPBAR */}
        <div className="search-topbar">
          <button className="search-back" onClick={() => navigate(-1)} id="search-back-btn">◀ Back</button>
          <h1 className="search-title">Discovery</h1>
        </div>

        {/* SEARCH INPUT */}
        <div className="search-bar-wrap">
          <div className="search-input-row">
            <span className="search-icon">⊕</span>
            <input
              ref={inputRef}
              id="search-user-input"
              className="search-input"
              placeholder="Search by username or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            {q && (
              <button className="search-clear" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear">✕</button>
            )}
          </div>
        </div>

        {/* RESULTS */}
        <div className="search-results" role="list" aria-label="Search results">
          <div className="search-section-label">
            {q ? `Results for "${q}"` : "All users in your orbit"}
          </div>
          {filtered.length === 0 ? (
            <div className="search-empty">
              <div style={{ fontSize: "40px" }}>⊘</div>
              <div>No users found</div>
            </div>
          ) : (
            filtered.map((user, i) => {
              const isContact = contactList?.includes(user._id?.toString());
              return (
                <div
                  key={user._id}
                  className="search-user-row"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  role="listitem"
                  id={`search-user-${user._id}`}
                >
                  <div className="search-user-avatar"
                    onClick={() => navigate(`/chat/${user.id || user._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {user.profilePic
                      ? <img src={user.profilePic} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      : <span>{user.username?.[0]?.toUpperCase() || "?"}</span>
                    }
                    {isOnline(user._id) && <div className="search-user-online" aria-label="Online" />}
                  </div>
                  <div className="search-user-info">
                    <div className="search-user-name">{user.username || "Unknown"}</div>
                    <div className="search-user-sub">{isOnline(user._id) ? "● Online" : "Last seen recently"}</div>
                  </div>
                  <button
                    className={`search-user-action${isContact ? " added" : ""}`}
                    id={`search-action-${user._id}`}
                    onClick={() => {
                      if (!isContact) addContact(user._id?.toString());
                    }}
                  >
                    {isContact ? "Contact" : "+ Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {mobile && (
          <BottomNav
            active="chat"
            onNavigate={(tab) => {
              if (tab === "home")    navigate("/");
              if (tab === "chat")   navigate("/chat");
              if (tab === "notifications") navigate("/notifications");
              if (tab === "settings") navigate("/settings");
            }}
          />
        )}
      </div>
    </>
  );
}
