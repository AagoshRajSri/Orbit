import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useBreakpoint, isMobileOrTablet } from "../lib/useBreakpoint";
import { BottomNav } from "../components/layout/BottomNav";
import toast from "../lib/toast";

const CSS = `
  .profile-root {
    min-height: 100dvh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  .profile-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px;
    height: 60px;
    background: var(--topbar-bg, rgba(5,5,8,0.95));
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .profile-back {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font); font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text2); padding: 7px 12px; border-radius: 6px;
    border: 1px solid var(--border); cursor: pointer;
    transition: all 0.2s;
  }
  .profile-back:hover { color: var(--acc); border-color: var(--acc); }
  .profile-title {
    font-family: var(--font); font-size: 16px;
    font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    flex: 1; text-align: center; margin-right: 60px; /* offset back btn */
  }

  .profile-body {
    flex: 1;
    padding: 40px 24px 100px;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    animation: orbit-fade-up .3s ease both;
  }

  /* AVATAR EDIT */
  .profile-avatar-sec {
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    margin-bottom: 40px;
  }
  .profile-avatar-wrap {
    width: 120px; height: 120px; border-radius: 50%;
    background: var(--surface2); border: 2px solid var(--border);
    position: relative; cursor: pointer; overflow: hidden;
    transition: all 0.3s;
  }
  .profile-avatar-wrap:hover { border-color: var(--acc); box-shadow: var(--shadow-acc); }
  .profile-avatar-img { width: 100%; height: 100%; object-fit: cover; }
  .profile-avatar-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center;
    justify-content: center; font-size: 32px; color: var(--text3);
  }
  .profile-avatar-edit-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s; font-size: 24px; color: white;
  }
  .profile-avatar-wrap:hover .profile-avatar-edit-overlay { opacity: 1; }

  /* FORM */
  .profile-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
    box-shadow: var(--shadow);
    display: flex; flex-direction: column; gap: 24px;
  }
  .profile-field { display: flex; flex-direction: column; gap: 8px; }
  .profile-label {
    font-family: var(--font); font-size: 11px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: var(--text2);
  }
  .profile-input, .profile-textarea {
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 12px 16px;
    color: var(--text); font-family: var(--font-body); font-size: 15px;
    transition: all 0.2s; outline: none; width: 100%;
  }
  .profile-input:focus, .profile-textarea:focus { border-color: var(--acc); box-shadow: 0 0 10px var(--acc-glow); }
  .profile-textarea { min-height: 100px; resize: vertical; }

  /* ACTIONS */
  .profile-actions {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 16px; border-top: 1px solid var(--border-soft); margin-top: 8px;
  }
  .profile-btn-danger {
    background: transparent; border: 1px solid var(--border); color: #ef4444;
    font-family: var(--font); font-size: 11px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; padding: 10px 16px; border-radius: var(--radius);
    transition: all 0.2s;
  }
  .profile-btn-danger:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; }
  
  .profile-btn-save {
    background: var(--acc2); border: 1px solid var(--acc); color: white;
    font-family: var(--font); font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; padding: 12px 24px; border-radius: var(--radius);
    transition: all 0.2s; box-shadow: var(--shadow-acc);
  }
  .profile-btn-save:hover:not(:disabled) { background: var(--acc); transform: translateY(-2px); }
  .profile-btn-save:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

  @media (max-width: 480px) {
    .profile-topbar { padding: 0 14px; }
    .profile-body { padding: 24px 16px 100px; }
    .profile-form { padding: 20px; }
    .profile-actions { flex-direction: column; gap: 16px; }
    .profile-btn-save, .profile-btn-danger { width: 100%; }
  }
`;

export default function ProfilePage() {
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const mobile = isMobileOrTablet(bp);
  
  const { authUser, isUpdatingProfile, updateProfile, deleteAccount } = useAuthStore();
  const [profileDraft, setProfileDraft] = useState({
    username: "", email: "", bio: "", profilePic: "", telegramId: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authUser) {
      setProfileDraft({
        username: authUser.username || "",
        email: authUser.email || "",
        bio: authUser.bio || "",
        profilePic: authUser.profilePic || "",
        telegramId: authUser.telegramId || "",
      });
    }
  }, [authUser]);

  const hasChanges = useMemo(() => {
    if (!authUser) return false;
    return (
      profileDraft.username !== authUser.username ||
      profileDraft.email !== authUser.email ||
      profileDraft.bio !== (authUser.bio || "") ||
      profileDraft.telegramId !== (authUser.telegramId || "") ||
      selectedImg !== null
    );
  }, [profileDraft, authUser, selectedImg]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setSelectedImg(reader.result);
      setProfileDraft(p => ({ ...p, profilePic: reader.result }));
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileDraft.username.trim() || !profileDraft.email.trim()) {
      toast.error("Username and email are required.");
      return;
    }
    try {
      const payload = {
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
        bio: profileDraft.bio,
        telegramId: profileDraft.telegramId,
      };
      if (selectedImg) payload.profilePic = selectedImg;

      await updateProfile(payload);
      setSelectedImg(null);
      toast.success("Identity updated successfully.");
    } catch (error) {
      toast.error("Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will delete your identity from the Orbit permanently.")) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Identity deleted.");
      navigate("/signup");
    } catch (err) {
      toast.error("Could not delete identity.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authUser) return <div className="profile-root"><div className="profile-body">Loading...</div></div>;

  return (
    <>
      <style>{CSS}</style>
      <div className="profile-root">
        <div className="profile-topbar">
          <button className="profile-back" onClick={() => navigate("/dreamland")}>◀ Hub</button>
          <div className="profile-title">Identity</div>
        </div>

        <div className="profile-body">
          <div className="profile-avatar-sec">
            <label className="profile-avatar-wrap">
              {profileDraft.profilePic ? (
                <img src={profileDraft.profilePic} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">◈</div>
              )}
              <div className="profile-avatar-edit-overlay">📷</div>
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            </label>
            <div className="profile-label">Vessel Appearance</div>
          </div>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-field">
              <label className="profile-label">Alias</label>
              <input
                className="profile-input"
                value={profileDraft.username}
                onChange={e => setProfileDraft(p => ({ ...p, username: e.target.value }))}
                placeholder="Your designation"
              />
            </div>
            
            <div className="profile-field">
              <label className="profile-label">Comm Link (Email)</label>
              <input
                className="profile-input"
                value={profileDraft.email}
                onChange={e => setProfileDraft(p => ({ ...p, email: e.target.value }))}
                type="email"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Encrypted Bio</label>
              <textarea
                className="profile-textarea"
                value={profileDraft.bio}
                onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                placeholder="Leave a mark in the void..."
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Telegram ID (Optional)</label>
              <input
                className="profile-input"
                value={profileDraft.telegramId}
                onChange={e => setProfileDraft(p => ({ ...p, telegramId: e.target.value }))}
                placeholder="For external notifications"
              />
            </div>

            <div className="profile-actions">
              <button type="button" className="profile-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Erasing..." : "Purge Identity"}
              </button>
              <button type="submit" className="profile-btn-save" disabled={!hasChanges || isUpdatingProfile}>
                {isUpdatingProfile ? "Syncing..." : "Sync Changes"}
              </button>
            </div>
          </form>
        </div>

        {mobile && (
          <BottomNav active="settings" onNavigate={tab => navigate(tab === "home" ? "/dreamland" : `/${tab}`)} />
        )}
      </div>
    </>
  );
}
