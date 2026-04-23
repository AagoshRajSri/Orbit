import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import OrbitalPageWrapper from "../components/OrbitalPageWrapper";
import {
  Camera,
  Mail,
  User,
  Edit,
  Save,
  Trash2,
  RotateCcw,
  Compass,
  Flower,
} from "lucide-react";
import toast from "../lib/toast";
import { useSoundManager } from "../hooks/useSoundManager";
import { useThemeStore } from "../store/useThemeStore";
import { AmoledProfile } from "../themes/amoledTheme";
import { GamerProfile } from "../themes/gamerTheme";
import { VampireProfile } from "../themes/darkTheme";
import { CyberpunkProfile } from "../themes/darkCyberpunkTheme";
import { LightProfile } from "../themes/lightTheme";
import { PastelProfile } from "../themes/pastelTheme";
const ProfilePage = () => {
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile, deleteAccount } =
    useAuthStore();
  const { play } = useSoundManager();
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    setProfileDraft({
      username: authUser.username || "",
      email: authUser.email || "",
      bio: authUser.bio || "",
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

  const hasChanges = useMemo(() => {
    if (!authUser) return false;
    return (
      profileDraft.username !== authUser.username ||
      profileDraft.email !== authUser.email ||
      profileDraft.bio !== (authUser.bio || "") ||
      selectedImg !== null
    );
  }, [profileDraft, authUser, selectedImg]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      setProfileDraft((prev) => ({ ...prev, profilePic: base64Image }));
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
      };
      if (selectedImg) payload.profilePic = selectedImg;

      await updateProfile(payload);
      setIsEditing(false);
      setSelectedImg(null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error("Profile update failed.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setTimeout(() => {
        toast.success(
          "You have a 30-second grace period to contact support to recover your account.",
        );
      }, 200);
      navigate("/signup");
    } catch (error) {
      toast.error("Could not delete account at this time.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authUser) {
    return (
      <OrbitalPageWrapper>
        <div className="p-6 text-base-content/70">Loading profile...</div>
      </OrbitalPageWrapper>
    );
  }

  if (theme === "amoled-dark") {
    return <AmoledProfile />;
  }

  if (theme === "gamer-high-energy") {
    return <GamerProfile />;
  }

  if (theme === "dark") {
    return <VampireProfile />;
  }

  if (theme === "light") {
    return <LightProfile />;
  }

  if (theme === "neon-cyberpunk") {
    return <CyberpunkProfile />;
  }

  if (theme === "pastel-dream") {
    return <PastelProfile />;
  }


  return (
    <OrbitalPageWrapper>
      {theme === "pastel-dream" && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[8%] left-[10%] text-5xl animate-bounce opacity-40">🎀</div>
          <div className="absolute top-[25%] right-[15%] text-4xl animate-pulse opacity-30">🌸</div>
          <div className="absolute bottom-[20%] left-[5%] text-5xl animate-bounce opacity-40">✨</div>
          <div className="absolute bottom-[10%] right-[10%] text-4xl animate-pulse opacity-30">💖</div>
          <div className="absolute top-[40%] left-[2%] text-3xl opacity-20">✿</div>
        </div>
      )}
      <div className="h-full min-h-0 overflow-y-auto py-8 relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          <button
            onClick={() => {
              play("click");
              navigate("/");
            }}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 mb-8 w-fit
              ${theme === "pastel-dream"
                ? "bg-white/70 border border-pink-100 text-[#d060a8] shadow-lg shadow-pink-100/50 hover:bg-white hover:scale-105 active:scale-95"
                : isLight
                ? "bg-white/80 border border-[#b08d57]/30 text-[#8c7055] shadow-md shadow-[rgba(176,141,87,0.1)] hover:bg-white hover:border-[#b08d57]/50 hover:scale-105 active:scale-95 tracking-widest"
                : "bg-base-300/40 backdrop-blur-md border border-base-content/10 text-base-content/70 hover:bg-base-300/60 hover:text-base-content"
              }
            `}
          >
            {theme === "pastel-dream" ? (
              <Flower className="size-4 text-pink-400" />
            ) : (
              <Compass className={`size-4 ${theme === "pastel-dream" ? "text-pink-400" : "text-primary"}`} />
            )}
            <span>{theme === "pastel-dream" ? "Back to Dreamland" : "Back to Orbit"}</span>
          </button>
          <div className="orbital-section space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className={`text-4xl font-black ${
                  theme === "pastel-dream"
                    ? "bg-gradient-to-r from-[#f472b6] via-[#c084fc] to-[#818cf8] bg-clip-text text-transparent drop-shadow-sm"
                    : isLight
                    ? "text-[#5c4a2a] uppercase tracking-widest"
                    : "text-base-content"
                }`}
                  style={
                    theme === "pastel-dream" ? { fontFamily: "'Pacifico', cursive" }
                    : isLight ? { fontFamily: "'Georgia', serif", letterSpacing: "0.12em" }
                    : {}
                  }
                >
                  {theme === "pastel-dream" ? "Your Profile" : isLight ? "Profile" : "Profile"} {theme === "pastel-dream" && "🎀"}
                </h1>
                <p className={`mt-2 ${
                  theme === "pastel-dream"
                    ? "text-pink-400 font-bold uppercase tracking-widest text-xs"
                    : isLight
                    ? "text-[#b08d57] font-bold uppercase tracking-widest text-xs"
                    : "orbital-subtitle"
                }`}>
                  {theme === "pastel-dream" ? "Your magical identity ✨" : isLight ? "Your distinguished identity" : "Manage your account and Orbit identity"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="orbital-btn-secondary gap-2 text-sm py-2"
                  type="button"
                  onClick={() => {
                    setIsEditing((prev) => !prev);
                    if (!isEditing) toast.success("Inline editing enabled");
                  }}
                >
                  <Edit className="w-4 h-4" />
                  {isEditing ? "View" : "Edit"}
                </button>
                <button
                  className="orbital-btn-ghost gap-2 text-sm py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className={`grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 p-8 rounded-[2.5rem] border backdrop-blur-md ${
                theme === "pastel-dream"
                  ? "bg-gradient-to-br from-white/90 via-pink-50/70 to-purple-50/60 border-pink-200/60 shadow-2xl shadow-pink-100/60"
                  : isLight
                  ? "bg-gradient-to-br from-white/95 via-[#faf7f0]/80 to-[#f0ebd8]/60 border-[#b08d57]/20 shadow-2xl shadow-[rgba(176,141,87,0.1)]"
                  : "bg-transparent border-transparent"
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className={`absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                    theme === "pastel-dream"
                      ? "bg-gradient-to-br from-[#f472b6] to-[#c084fc] animate-pulse"
                      : isLight
                      ? "bg-gradient-to-br from-[#b08d57] to-[#8c7055]"
                      : "bg-primary"
                  }`} />
                  <img
                    src={profileDraft.profilePic || "/avatar.png"}
                    alt="Profile"
                    className={`size-32 rounded-3xl object-cover relative z-10 border-4 ${
                      theme === "pastel-dream"
                        ? "border-white shadow-xl shadow-pink-200/60 rotate-3 group-hover:rotate-0 transition-transform duration-500"
                        : isLight
                        ? "border-[#f0ebd8] shadow-xl shadow-[rgba(176,141,87,0.2)] group-hover:scale-105 transition-transform duration-500"
                        : "border-primary/50"
                    }`}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute bottom-0 right-0 rounded-full p-3 transition-all text-primary-content cursor-pointer shadow-lg ${
                      isUpdatingProfile ? "pointer-events-none opacity-60" : ""
                    } ${
                      theme === "pastel-dream"
                        ? "bg-gradient-to-br from-[#f472b6] to-[#c084fc] shadow-pink-300/50 hover:brightness-110"
                        : isLight
                        ? "bg-gradient-to-br from-[#b08d57] to-[#8c7055] shadow-[rgba(176,141,87,0.4)] hover:brightness-110"
                        : "bg-primary hover:brightness-110 shadow-primary/50"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUpdatingProfile}
                    />
                  </label>
                </div>
                <p className="orbital-subtitle">Upload a profile picture</p>
              </div>

              <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      theme === "pastel-dream" ? "text-pink-500"
                      : isLight ? "text-[#b08d57]"
                      : "orbital-label"}`}>
                      <User className="size-3.5" />
                      Persona Name
                    </span>
                    <input
                      type="text"
                      value={profileDraft.username}
                      onChange={(e) =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                        theme === "pastel-dream" ? "bg-pink-50/50 border-pink-100 text-[#d060a8] focus:bg-white focus:border-pink-300 placeholder-pink-200"
                        : isLight ? "bg-[#faf7f0]/80 border-[#b08d57]/20 text-[#5c4a2a] focus:bg-white focus:border-[#b08d57]/50 placeholder-[#c9b99a]"
                        : "orbital-input"}`}
                      disabled={!isEditing}
                      placeholder={isLight ? "e.g. Distinguished Name" : "e.g. Dreamy Cat"}
                      aria-label="Full Name"
                    />
                  </label>

                <label className="block">
                  <span className="orbital-label flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(e) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="orbital-input"
                    disabled={!isEditing}
                    aria-label="Email"
                  />
                </label>

                  <label className="block space-y-2">
                    <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      theme === "pastel-dream" ? "text-purple-500"
                      : isLight ? "text-[#8c7055]"
                      : "orbital-label"}`}>
                      Bio
                    </span>
                    <textarea
                      value={profileDraft.bio}
                      onChange={(e) =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                        theme === "pastel-dream" ? "bg-purple-50/30 border-purple-100 text-[#8e44ad] focus:bg-white focus:border-purple-300 placeholder-purple-200"
                        : isLight ? "bg-[#faf7f0]/80 border-[#b08d57]/20 text-[#5c4a2a] focus:bg-white focus:border-[#b08d57]/50 placeholder-[#c9b99a]"
                        : "orbital-textarea"}`}
                      rows={4}
                      disabled={!isEditing}
                      placeholder={isLight ? "Share your distinguished story..." : "Tell us about your magical adventures..."}
                      aria-label="Bio"
                    />
                  </label>

                {isEditing && (
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      className="orbital-btn-primary text-sm py-2"
                      disabled={!hasChanges || isUpdatingProfile}
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="orbital-btn-ghost text-sm py-2"
                      onClick={() => {
                        setProfileDraft({
                          username: authUser.username || "",
                          email: authUser.email || "",
                          bio: authUser.bio || "",
                          profilePic: authUser.profilePic || "",
                        });
                        setSelectedImg(null);
                        setIsEditing(false);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}

                {!isEditing && (
                  <div className="orbital-subtitle pt-2">
                    Turn on edit mode to make profile updates.
                  </div>
                )}
              </div>
            </form>

            <div className={`p-4 rounded-lg border-l-2 ${
              theme === "pastel-dream"
                ? "bg-gradient-to-r from-pink-50/80 to-purple-50/50 border-pink-300/60 border rounded-2xl shadow-md shadow-pink-100/40"
                : isLight
                ? "bg-gradient-to-r from-white/90 to-[#f0ebd8]/60 border-[#b08d57]/30 border rounded-2xl shadow-md shadow-[rgba(176,141,87,0.08)]"
                : "orbital-glass-sm border-primary/50"
            }`}>
              <h2 className={`font-semibold mb-3 ${
                theme === "pastel-dream" ? "text-[#c060a8]" : isLight ? "text-[#5c4a2a]" : "text-base-content"
              }`}>
                {theme === "pastel-dream" ? "✦ Account Details" : "Account Details"}
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-base-content/70">
                <div>
                  <strong className={theme === "pastel-dream" ? "text-[#d060a8]" : "text-base-content/90"}>Member Since:</strong>
                  <div className="mt-1">
                    {authUser.createdAt?.split("T")[0] || "N/A"}
                  </div>
                </div>
                <div>
                  <strong className={theme === "pastel-dream" ? "text-[#9333ea]" : "text-base-content/90"}>Status:</strong>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                      theme === "pastel-dream"
                        ? "bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-200/60"
                        : "bg-success/10"
                    }`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        theme === "pastel-dream" ? "bg-pink-400" : "bg-success"
                      }`} />
                      <span className={theme === "pastel-dream" ? "text-[#d060a8] font-semibold" : "text-success"}>Active ✨</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/60 backdrop-blur-sm p-4">
            <div className="orbital-glass-card p-6 w-full max-w-md border-error/30">
              <h3 className="text-xl font-bold text-error">
                Delete Account?
              </h3>
              <p className="text-sm text-base-content/70 mt-3">
                This action is irreversible. Your profile data will be removed,
                and you will be signed out. A soft recovery window of 30s is
                suggested in underlying API.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="orbital-btn-ghost py-2"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-error hover:brightness-110 text-error-content font-semibold transition-all"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrbitalPageWrapper>
  );
};

export default ProfilePage;
