import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import OrbitalPageWrapper from "../components/OrbitalPageWrapper";
import {
  Bell,
  Menu,
  Palette,
  Save,
  RotateCcw,
  Shield,
  User as UserIcon,
  X,
  Lock,
  Send,
  Compass,
  Music,
} from "lucide-react";
import { useSoundManager } from "../hooks/useSoundManager";

import { THEMES, THEME_LABELS } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { axiosInstance } from "../lib/axios.jsx";
import { VampireSettings } from "../themes/darkTheme";
import { AmoledSettings } from "../themes/amoledTheme";
import { GamerSettings } from "../themes/gamerTheme";
import { CyberpunkSettings } from "../themes/darkCyberpunkTheme";
import { LightSettings } from "../themes/lightTheme";
import { PastelSettings } from "../themes/pastelTheme";
import { useNavigate } from "react-router-dom";
import AnimalEasterEggs, {
  FlyingBirdTrigger,
} from "../components/welcome/AnimalEasterEggs";

const STORAGE_KEYS = {
  displayName: "orbit_displayName_v1",
  notifications: "orbit_notifications_v1",
  showOnlineStatus: "orbit_showOnlineStatus_v1",
  orbitBehavior: "orbit_orbitBehavior_v1",
  soundSettings: "orbit_soundSettings_v1",
};

const DEFAULT_ORBIT_BEHAVIOR = {
  showRings: true,
  autoPauseOnHover: true,
  interactionFilter: "all",
  theme: "nebula",
};

const DEFAULT_SOUND_SETTINGS = {
  volume: 0.7,
  effectsEnabled: true,
  clickSound: true,
  messageSound: true,
};

const DEFAULT_NOTIFICATIONS = {
  desktop: true,
  sound: true,
  email: false,
};

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label
      className={`flex items-start justify-between gap-4 py-3 border-b border-base-300/60 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {description && (
          <div className="text-xs text-base-content/65 mt-1">{description}</div>
        )}
      </div>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        aria-label={label}
        disabled={disabled}
      />
    </label>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.authUser);
  const { theme: currentTheme, setTheme, setIsConfirming } = useThemeStore();

  const navItems = useMemo(
    () => [
      {
        key: "profile",
        label: "Profile",
        icon: UserIcon,
        color: "text-blue-400",
      },
      { key: "sound", label: "Sound", icon: Music, color: "text-green-400" },
      {
        key: "notifications",
        label: "Notifications",
        icon: Bell,
        color: "text-orange-400",
      },
      {
        key: "appearance",
        label: "Appearance",
        icon: Palette,
        color: "text-purple-400",
      },
      {
        key: "orbit",
        label: "Orbit Behavior",
        icon: Compass,
        color: "text-cyan-400",
      },
      {
        key: "security",
        label: "Security",
        icon: Shield,
        color: "text-red-400",
      },
    ],
    [],
  );

  const [activeSection, setActiveSection] = useState("profile");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Draft vs saved state (to power the sticky Save/Reset UX)
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [draftDisplayName, setDraftDisplayName] = useState("");

  const [savedBio, setSavedBio] = useState("");
  const [draftBio, setDraftBio] = useState("");

  const [savedTheme, setSavedTheme] = useState(currentTheme);
  const [draftTheme, setDraftTheme] = useState(currentTheme);

  const [savedNotifications, setSavedNotifications] = useState(
    DEFAULT_NOTIFICATIONS,
  );
  const [draftNotifications, setDraftNotifications] = useState(
    DEFAULT_NOTIFICATIONS,
  );

  const [savedShowOnlineStatus, setSavedShowOnlineStatus] = useState(true);
  const [draftShowOnlineStatus, setDraftShowOnlineStatus] = useState(true);

  const [savedOrbitBehavior, setSavedOrbitBehavior] = useState(
    DEFAULT_ORBIT_BEHAVIOR,
  );
  const [draftOrbitBehavior, setDraftOrbitBehavior] = useState(
    DEFAULT_ORBIT_BEHAVIOR,
  );

  const [savedSoundSettings, setSavedSoundSettings] = useState(
    DEFAULT_SOUND_SETTINGS,
  );
  const [draftSoundSettings, setDraftSoundSettings] = useState(
    DEFAULT_SOUND_SETTINGS,
  );

  const didInitRef = useRef(false);
  const hasStoredDisplayNameRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const safeReadJson = (key, fallback) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    };

    const storedNameRaw = localStorage.getItem(STORAGE_KEYS.displayName);
    hasStoredDisplayNameRef.current = Boolean(storedNameRaw);
    let resolvedName = "";
    if (storedNameRaw) {
      try {
        resolvedName = JSON.parse(storedNameRaw);
      } catch {
        resolvedName = storedNameRaw;
      }
    }

    const storedNotifs = safeReadJson(
      STORAGE_KEYS.notifications,
      DEFAULT_NOTIFICATIONS,
    );
    const storedShowOnline = safeReadJson(STORAGE_KEYS.showOnlineStatus, true);

    setSavedDisplayName(resolvedName);
    setDraftDisplayName(resolvedName);

    setSavedBio(authUser?.bio || "");
    setDraftBio(authUser?.bio || "");

    setSavedNotifications(storedNotifs);
    setDraftNotifications(storedNotifs);

    setSavedShowOnlineStatus(storedShowOnline);
    setDraftShowOnlineStatus(storedShowOnline);

    const storedOrbitBehavior = safeReadJson(
      STORAGE_KEYS.orbitBehavior,
      DEFAULT_ORBIT_BEHAVIOR,
    );

    const storedSoundSettings = safeReadJson(
      STORAGE_KEYS.soundSettings,
      DEFAULT_SOUND_SETTINGS,
    );

    setSavedTheme(currentTheme);
    setDraftTheme(currentTheme);

    setSavedOrbitBehavior(storedOrbitBehavior);
    setDraftOrbitBehavior(storedOrbitBehavior);

    setSavedSoundSettings(storedSoundSettings);
    setDraftSoundSettings(storedSoundSettings);
  }, [currentTheme]);

  useEffect(() => {
    // If the user never saved a custom display name, initialize from auth.
    if (!authUser?.username) return;
    if (hasStoredDisplayNameRef.current) return;
    if (!didInitRef.current) return;

    // Always initialize from auth username, ensuring sync
    setSavedDisplayName(authUser.username);
    setDraftDisplayName(authUser.username);
    
    setSavedBio(authUser.bio || "");
    setDraftBio(authUser.bio || "");
  }, [authUser?.username, authUser?.bio]);

  const isDirty = useMemo(() => {
    return (
      draftDisplayName !== savedDisplayName ||
      draftBio !== savedBio ||
      draftTheme !== savedTheme ||
      draftNotifications.desktop !== savedNotifications.desktop ||
      draftNotifications.sound !== savedNotifications.sound ||
      draftNotifications.email !== savedNotifications.email ||
      draftShowOnlineStatus !== savedShowOnlineStatus ||
      draftOrbitBehavior.showRings !== savedOrbitBehavior.showRings ||
      draftOrbitBehavior.autoPauseOnHover !==
        savedOrbitBehavior.autoPauseOnHover ||
      draftOrbitBehavior.interactionFilter !==
        savedOrbitBehavior.interactionFilter ||
      draftOrbitBehavior.theme !== savedOrbitBehavior.theme ||
      draftSoundSettings.volume !== savedSoundSettings.volume ||
      draftSoundSettings.effectsEnabled !== savedSoundSettings.effectsEnabled ||
      draftSoundSettings.clickSound !== savedSoundSettings.clickSound ||
      draftSoundSettings.messageSound !== savedSoundSettings.messageSound
    );
  }, [
    draftDisplayName,
    savedDisplayName,
    draftTheme,
    savedTheme,
    draftNotifications,
    savedNotifications,
    draftShowOnlineStatus,
    savedShowOnlineStatus,
    draftSoundSettings,
    savedSoundSettings,
  ]);

  const activeLabel = navItems.find((n) => n.key === activeSection)?.label;

  const handleReset = () => {
    setDraftDisplayName(savedDisplayName);
    setDraftBio(savedBio);
    setDraftTheme(savedTheme);
    setDraftNotifications(savedNotifications);
    setDraftShowOnlineStatus(savedShowOnlineStatus);
    setDraftOrbitBehavior(savedOrbitBehavior);
    setDraftSoundSettings(savedSoundSettings);
    toast.success("Changes reset");
  };

  const handleSave = async (forceTheme) => {
    const finalTheme = forceTheme || draftTheme;
    // If theme changed and not forced, show confirmation
    if (!forceTheme && finalTheme !== currentTheme) {
      setIsConfirming(true, finalTheme);
      return;
    }

    // Persist draft values locally (theme is applied globally via the theme store).
    try {
      // Update username on backend if it has changed
      if ((draftDisplayName !== authUser?.username && draftDisplayName.trim()) || draftBio !== authUser?.bio) {
        await axiosInstance.put("/auth/update-profile", {
          username: draftDisplayName.trim(),
          bio: draftBio,
        });
        // Update auth store with new values
        useAuthStore.setState((state) => ({
          authUser: {
            ...state.authUser,
            username: draftDisplayName.trim(),
            bio: draftBio,
          },
        }));
      }

      localStorage.setItem(
        STORAGE_KEYS.displayName,
        JSON.stringify(draftDisplayName),
      );
      localStorage.setItem(
        STORAGE_KEYS.notifications,
        JSON.stringify(draftNotifications),
      );
      localStorage.setItem(
        STORAGE_KEYS.showOnlineStatus,
        JSON.stringify(draftShowOnlineStatus),
      );

      setSavedDisplayName(draftDisplayName);
      setSavedBio(draftBio);
      setSavedNotifications(draftNotifications);
      setSavedShowOnlineStatus(draftShowOnlineStatus);
      setSavedOrbitBehavior(draftOrbitBehavior);
      setSavedTheme(draftTheme);
      setSavedSoundSettings(draftSoundSettings);

      localStorage.setItem(
        STORAGE_KEYS.orbitBehavior,
        JSON.stringify(draftOrbitBehavior),
      );

      localStorage.setItem(
        STORAGE_KEYS.soundSettings,
        JSON.stringify(draftSoundSettings),
      );

      setTheme(draftTheme);
      toast.success("Settings saved");
      setMobileNavOpen(false);
    } catch (e) {
      toast.error("Could not save settings");
      const errorMsg =
        e?.message || (typeof e === "string" ? e : "Unknown error");
      console.error("Save error:", errorMsg);
    }
  };

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Backend endpoint may not exist in this repo; treat it gracefully.
      await axiosInstance.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully");
      setIsPasswordModalOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Change password is not supported by the backend yet");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isPastel = currentTheme === "pastel-dream";

  // Delegate rendering for high-fidelity themes
  if (currentTheme === "dark") {
    return (
      <VampireSettings 
        activeSection={activeSection} setActiveSection={setActiveSection}
        draftTheme={draftTheme} setDraftTheme={setDraftTheme}
        draftDisplayName={draftDisplayName} setDraftDisplayName={setDraftDisplayName}
        draftBio={draftBio} setDraftBio={setDraftBio}
        draftNotifications={draftNotifications} setDraftNotifications={setDraftNotifications}
        draftShowOnlineStatus={draftShowOnlineStatus} setDraftShowOnlineStatus={setDraftShowOnlineStatus}
        draftOrbitBehavior={draftOrbitBehavior} setDraftOrbitBehavior={setDraftOrbitBehavior}
        draftSoundSettings={draftSoundSettings} setDraftSoundSettings={setDraftSoundSettings}
        isDirty={isDirty} handleSave={handleSave} handleReset={handleReset} authUser={authUser} navigate={navigate}
      />
    );
  }
  if (currentTheme === "pastel-dream") {
    return (
      <PastelSettings 
        activeSection={activeSection} setActiveSection={setActiveSection}
        draftTheme={draftTheme} setDraftTheme={setDraftTheme}
        draftDisplayName={draftDisplayName} setDraftDisplayName={setDraftDisplayName}
        draftBio={draftBio} setDraftBio={setDraftBio}
        draftNotifications={draftNotifications} setDraftNotifications={setDraftNotifications}
        draftShowOnlineStatus={draftShowOnlineStatus} setDraftShowOnlineStatus={setDraftShowOnlineStatus}
        draftOrbitBehavior={draftOrbitBehavior} setDraftOrbitBehavior={setDraftOrbitBehavior}
        draftSoundSettings={draftSoundSettings} setDraftSoundSettings={setDraftSoundSettings}
        isDirty={isDirty} handleSave={handleSave} handleReset={handleReset} authUser={authUser} navigate={navigate}
      />
    );
  }
  if (currentTheme === "amoled-dark") {
    return (
      <AmoledSettings 
        activeSection={activeSection} setActiveSection={setActiveSection}
        draftTheme={draftTheme} setDraftTheme={setDraftTheme}
        draftDisplayName={draftDisplayName} setDraftDisplayName={setDraftDisplayName}
        draftNotifications={draftNotifications} setDraftNotifications={setDraftNotifications}
        draftShowOnlineStatus={draftShowOnlineStatus} setDraftShowOnlineStatus={setDraftShowOnlineStatus}
        draftOrbitBehavior={draftOrbitBehavior} setDraftOrbitBehavior={setDraftOrbitBehavior}
        draftSoundSettings={draftSoundSettings} setDraftSoundSettings={setDraftSoundSettings}
        isDirty={isDirty} handleSave={handleSave} handleReset={handleReset} authUser={authUser}
      />
    );
  }
  if (currentTheme === "gamer-high-energy") {
    return (
      <GamerSettings 
        activeSection={activeSection} setActiveSection={setActiveSection}
        draftTheme={draftTheme} setDraftTheme={setDraftTheme}
        draftDisplayName={draftDisplayName} setDraftDisplayName={setDraftDisplayName}
        draftNotifications={draftNotifications} setDraftNotifications={setDraftNotifications}
        draftShowOnlineStatus={draftShowOnlineStatus} setDraftShowOnlineStatus={setDraftShowOnlineStatus}
        draftOrbitBehavior={draftOrbitBehavior} setDraftOrbitBehavior={setDraftOrbitBehavior}
        draftSoundSettings={draftSoundSettings} setDraftSoundSettings={setDraftSoundSettings}
        isDirty={isDirty} handleSave={handleSave} handleReset={handleReset} authUser={authUser}
      />
    );
  }
  if (currentTheme === "light") {
    return (
      <LightSettings 
        activeSection={activeSection} setActiveSection={setActiveSection}
        draftTheme={draftTheme} setDraftTheme={setDraftTheme}
        draftDisplayName={draftDisplayName} setDraftDisplayName={setDraftDisplayName}
        draftBio={draftBio} setDraftBio={setDraftBio}
        draftNotifications={draftNotifications} setDraftNotifications={setDraftNotifications}
        draftShowOnlineStatus={draftShowOnlineStatus} setDraftShowOnlineStatus={setDraftShowOnlineStatus}
        draftOrbitBehavior={draftOrbitBehavior} setDraftOrbitBehavior={setDraftOrbitBehavior}
        draftSoundSettings={draftSoundSettings} setDraftSoundSettings={setDraftSoundSettings}
        isDirty={isDirty} handleSave={handleSave} handleReset={handleReset} authUser={authUser}
      />
    );
  }
  if (currentTheme === "neon-cyberpunk") {
    return (
      <CyberpunkSettings 
        activeSection={activeSection} setActiveSection={setActiveSection}
        draftTheme={draftTheme} setDraftTheme={setDraftTheme}
        draftDisplayName={draftDisplayName} setDraftDisplayName={setDraftDisplayName}
        draftBio={draftBio} setDraftBio={setDraftBio}
        draftNotifications={draftNotifications} setDraftNotifications={setDraftNotifications}
        draftShowOnlineStatus={draftShowOnlineStatus} setDraftShowOnlineStatus={setDraftShowOnlineStatus}
        draftOrbitBehavior={draftOrbitBehavior} setDraftOrbitBehavior={setDraftOrbitBehavior}
        draftSoundSettings={draftSoundSettings} setDraftSoundSettings={setDraftSoundSettings}
        isDirty={isDirty} handleSave={handleSave} handleReset={handleReset} authUser={authUser}
      />
    );
  }

  return (
    <OrbitalPageWrapper>
      <div
        className={`h-full min-h-screen relative overflow-hidden transition-colors duration-500 ${isPastel ? "bg-[#fffafa]" : "bg-transparent"}`}
      >
        {isPastel && <AnimalEasterEggs />}
        <div className="h-full min-h-0 flex flex-col relative z-10 px-4">
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Mobile top menu */}
            <div
              className={`lg:hidden p-4 border-b backdrop-blur-md ${isPastel ? "bg-white/40 border-pink-100" : "bg-base-100/60 border-base-300/60"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMobileNavOpen((v) => !v)}
                  aria-label="Open settings menu"
                >
                  <Menu className="size-5" />
                </button>
                <div className="font-semibold truncate">{activeLabel}</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close settings menu"
                  style={{ visibility: mobileNavOpen ? "visible" : "hidden" }}
                >
                  <X className="size-5" />
                </button>
              </div>

              {mobileNavOpen && (
                <div className="mt-3 rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur-md p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.key === activeSection;
                    return (
                      <button
                        key={item.key}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-primary/10 border border-primary/30 text-base-content"
                            : "bg-transparent hover:bg-base-200/40"
                        }`}
                        onClick={() => {
                          setActiveSection(item.key);
                          setMobileNavOpen(false);
                        }}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon className={`size-4 ${item.color}`} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {isActive && (
                          <span className="text-primary font-bold">•</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Back Button for standard themes */}
            <div className="px-4 lg:px-6 pt-4">
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isPastel
                    ? "text-[#c05090]/60 hover:text-[#c05090]"
                    : "text-base-content/60 hover:text-base-content"
                }`}
              >
                ← Return to Orbit
              </button>
            </div>

            {/* Desktop two-column layout */}
            <div className="h-full min-h-0 grid grid-cols-12 gap-6 p-4 lg:p-6">
              <aside className="hidden lg:block col-span-12 lg:col-span-3 min-w-0">
                <div className="h-full rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-3 flex flex-col">
                  <div className="px-2 py-3">
                    <FlyingBirdTrigger>
                      <h2
                        className={`text-2xl font-black cursor-pointer ${isPastel ? "text-pink-600" : "text-white"}`}
                      >
                        Settings 🎀
                      </h2>
                    </FlyingBirdTrigger>
                    <p className="text-xs text-base-content/65 mt-1">
                      Customize your experience
                    </p>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.key === activeSection;
                      return (
                        <button
                          key={item.key}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                            isActive
                              ? "bg-primary/10 border border-primary/30 text-base-content"
                              : "bg-transparent hover:bg-base-200/40 border border-transparent"
                          }`}
                          onClick={() => setActiveSection(item.key)}
                        >
                          <Icon className={`size-4 ${item.color}`} />
                          <span className="text-left">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="col-span-12 lg:col-span-9 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto pr-0 lg:pr-2">
                  {/* PROFILE */}
                  {activeSection === "profile" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Profile</h3>
                        <p className="text-sm text-base-content/65 mt-1">
                          Edit your display name and see a live preview.
                        </p>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-4 items-start">
                        <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5">
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-semibold">
                                Display Name
                              </div>
                              <div className="text-xs text-base-content/65 mt-1">
                                Update your account username. Changes will sync
                                with your account.
                              </div>
                            </div>

                            <input
                              className="input input-bordered w-full"
                              value={draftDisplayName}
                              onChange={(e) =>
                                setDraftDisplayName(e.target.value)
                              }
                              placeholder="Your display name"
                            />
                          </div>

                          <div className="mt-4 text-xs text-base-content/65">
                            {authUser?.username && (
                              <span>
                                Current account username:{" "}
                                <span className="font-semibold">
                                  {authUser.username}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5">
                          <div className="text-sm font-semibold">
                            Live Preview
                          </div>
                          <div className="mt-4 rounded-2xl border border-base-300/60 bg-base-200/30 p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {(draftDisplayName || "Orbit")
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {draftDisplayName?.trim() || "Orbit"}
                                </div>
                                <div className="text-xs text-base-content/65 mt-1">
                                  {draftShowOnlineStatus
                                    ? "Online"
                                    : "Invisible"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-base-content/65">
                            Preview uses your draft values. Save to persist.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTIFICATIONS */}
                  {activeSection === "notifications" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Notifications</h3>
                        <p className="text-sm text-base-content/65 mt-1">
                          Choose which alerts you want to receive.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5">
                        <ToggleRow
                          label="Desktop Notifications"
                          description="Show toast notifications while you chat."
                          checked={draftNotifications.desktop}
                          onChange={(v) =>
                            setDraftNotifications((prev) => ({
                              ...prev,
                              desktop: v,
                            }))
                          }
                        />
                        <ToggleRow
                          label="Sound Effects"
                          description="Play subtle sounds for incoming messages."
                          checked={draftNotifications.sound}
                          onChange={(v) =>
                            setDraftNotifications((prev) => ({
                              ...prev,
                              sound: v,
                            }))
                          }
                        />
                        <ToggleRow
                          label="Email Digests"
                          description="Get periodic email summaries (if enabled)."
                          checked={draftNotifications.email}
                          onChange={(v) =>
                            setDraftNotifications((prev) => ({
                              ...prev,
                              email: v,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* ORBIT */}
                  {activeSection === "orbit" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Orbit Behavior</h3>
                        <p className="text-sm text-base-content/65 mt-1">
                          Configure how the Orbit visualization behaves and
                          interacts.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5 space-y-4">
                        <ToggleRow
                          label="Show Orbital Rings"
                          description="Toggle the orbit ring visibility in the 3D scene."
                          checked={draftOrbitBehavior.showRings}
                          onChange={(v) =>
                            setDraftOrbitBehavior((prev) => ({
                              ...prev,
                              showRings: v,
                            }))
                          }
                        />
                        <ToggleRow
                          label="Pause on Hover"
                          description="Pause ring animation when hovering over nodes."
                          checked={draftOrbitBehavior.autoPauseOnHover}
                          onChange={(v) =>
                            setDraftOrbitBehavior((prev) => ({
                              ...prev,
                              autoPauseOnHover: v,
                            }))
                          }
                        />
                        <div className="space-y-1">
                          <label className="text-sm font-semibold">
                            Interaction Filter
                          </label>
                          <select
                            className="select select-bordered w-full"
                            value={draftOrbitBehavior.interactionFilter}
                            onChange={(e) =>
                              setDraftOrbitBehavior((prev) => ({
                                ...prev,
                                interactionFilter: e.target.value,
                              }))
                            }
                          >
                            <option value="all">All nodes</option>
                            <option value="active">Active only</option>
                            <option value="mutual">Mutual orbits</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-semibold">
                            Orbit Theme
                          </label>
                          <select
                            className="select select-bordered w-full"
                            value={draftOrbitBehavior.theme}
                            onChange={(e) =>
                              setDraftOrbitBehavior((prev) => ({
                                ...prev,
                                theme: e.target.value,
                              }))
                            }
                          >
                            <option value="nebula">Nebula</option>
                            <option value="aurora">Aurora</option>
                            <option value="cosmic">Cosmic</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* APPEARANCE */}
                  {activeSection === "appearance" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Appearance</h3>
                        <p className="text-sm text-base-content/65 mt-1">
                          Keep your Orbit UI looking sharp. Pastel Dream is
                          included.
                        </p>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6 items-start">
                        <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5">
                          <div className="text-sm font-semibold mb-3">
                            Theme
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {THEMES.map((t) => {
                              const isSelected = draftTheme === t;
                              
                              // Fixed preview colors for each theme
                              let previewPrimary = "#3b82f6"; // default (blue)
                              let previewBg = "#ffffff";
                              
                              if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                              else if (t === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                              else if (t === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                              else if (t === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                              else if (t === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                              else if (t === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                              return (
                                <button
                                  key={t}
                                  className={`theme-select-button group flex flex-col items-center gap-3 p-3 rounded-xl transition-colors border ${
                                    isSelected
                                      ? "bg-base-200 border-primary active"
                                      : "hover:bg-base-200/50 border-base-300"
                                  }`}
                                  onClick={() => setDraftTheme(t)}
                                  type="button"
                                >
                                  <div
                                    className="theme-preview-swatch relative h-12 w-full rounded-lg overflow-hidden border-2"
                                    style={{
                                      background: previewBg,
                                      borderColor: isSelected ? previewPrimary : "rgba(128,128,128,0.2)",
                                    }}
                                  >
                                    <div className="absolute inset-0 flex p-1.5 gap-1.5">
                                      <div
                                        className="theme-preview-color flex-1 rounded-sm"
                                        style={{ background: previewPrimary }}
                                      />
                                      <div
                                        className="theme-preview-color flex-1 rounded-sm"
                                        style={{ background: previewBg }}
                                      />
                                    </div>
                                    {/* Theme indicator icon */}
                                    {isSelected && (
                                      <div
                                        className="theme-indicator absolute top-1 right-1 w-2 h-2 rounded-full"
                                        style={{
                                          background: previewPrimary,
                                          boxShadow: `0 0 8px ${previewPrimary}`,
                                        }}
                                      />
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold truncate w-full text-center">
                                    {THEME_LABELS[t] ?? t}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-4 text-xs text-base-content/65 italic">
                            Changes apply when you hit Save.
                          </div>
                        </div>

                        <div className="theme-preview-container rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5">
                          <div className="text-sm font-semibold mb-3">
                            Preview
                          </div>
                          <div
                            className="preview-chat-container rounded-xl border border-base-300 overflow-hidden shadow-lg"
                            data-theme={draftTheme}
                          >
                            <div className="p-4 bg-base-200">
                              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                                      {(draftDisplayName || "O")
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-sm">
                                        {draftDisplayName?.trim() ||
                                          "Orbit User"}
                                      </h3>
                                      <p className="text-xs text-base-content/70">
                                        {draftShowOnlineStatus
                                          ? "Online"
                                          : "Invisible"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100 theme-preview-scroll">
                                  {PREVIEW_MESSAGES.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`flex ${
                                        message.isSent
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      <div
                                        className={`
                                      preview-message-bubble
                                      max-w-[80%] rounded-xl p-3 shadow-sm
                                      ${
                                        message.isSent
                                          ? "bg-primary text-primary-content"
                                          : "bg-base-200"
                                      }
                                    `}
                                      >
                                        <p className="text-sm">
                                          {message.content}
                                        </p>
                                        <p
                                          className={`
                                        text-[10px] mt-1.5
                                        ${
                                          message.isSent
                                            ? "text-primary-content/70"
                                            : "text-base-content/70"
                                        }
                                      `}
                                        >
                                          12:00 PM
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="p-4 border-t border-base-300 bg-base-100">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      className="input input-bordered flex-1 text-sm h-10"
                                      placeholder="Type a message..."
                                      value="This is a preview"
                                      readOnly
                                    />
                                    <button className="btn btn-primary h-10 min-h-0">
                                      <Send size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SOUND */}
                  {activeSection === "sound" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Sound</h3>
                        <p className="text-sm text-base-content/65 mt-1">
                          Adjust volume and audio effect preferences.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5 space-y-6">
                        {/* Volume Control with Smooth Slider */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">
                                Master Volume
                              </div>
                              <div className="text-xs text-base-content/65 mt-1">
                                Control overall sound level (0% - 100%)
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-400 tabular-nums">
                              {Math.round(draftSoundSettings.volume * 100)}%
                            </div>
                          </div>

                          {/* Custom Smooth Slider */}
                          <div className="relative h-8 bg-gradient-to-r from-base-300/30 to-base-300/10 rounded-full flex items-center px-2 shadow-inner">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={draftSoundSettings.volume}
                              onChange={(e) =>
                                setDraftSoundSettings((prev) => ({
                                  ...prev,
                                  volume: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full h-1 appearance-none bg-transparent rounded-full outline-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${
                                  draftSoundSettings.volume * 100
                                }%, rgb(88, 88, 88) ${draftSoundSettings.volume * 100}%, rgb(88, 88, 88) 100%)`,
                              }}
                            />
                          </div>

                          <style>{`
                        input[type="range"] {
                          -webkit-appearance: slider-horizontal;
                        }
                        input[type="range"]::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74));
                          cursor: pointer;
                          box-shadow: 0 0 12px rgba(34, 197, 94, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4);
                          transition: all 0.15s ease-out;
                          border: 2px solid rgba(255, 255, 255, 0.2);
                        }
                        input[type="range"]::-webkit-slider-thumb:hover {
                          transform: scale(1.15);
                          box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5);
                        }
                        input[type="range"]::-webkit-slider-thumb:active {
                          transform: scale(1.08);
                        }
                        input[type="range"]::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74));
                          cursor: pointer;
                          box-shadow: 0 0 12px rgba(34, 197, 94, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4);
                          transition: all 0.15s ease-out;
                          border: 2px solid rgba(255, 255, 255, 0.2);
                        }
                        input[type="range"]::-moz-range-thumb:hover {
                          transform: scale(1.15);
                          box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5);
                        }
                        input[type="range"]::-moz-range-thumb:active {
                          transform: scale(1.08);
                        }
                      `}</style>
                        </div>

                        {/* Sound Effects Toggle */}
                        <div className="pt-4 border-t border-base-300/60">
                          <ToggleRow
                            label="Sound Effects"
                            description="Enable all audio effects and notifications."
                            checked={draftSoundSettings.effectsEnabled}
                            onChange={(v) =>
                              setDraftSoundSettings((prev) => ({
                                ...prev,
                                effectsEnabled: v,
                              }))
                            }
                          />
                        </div>

                        {/* Click Sound Toggle */}
                        <ToggleRow
                          label="Click Sounds"
                          description="Play subtle click sound on button interactions."
                          checked={
                            draftSoundSettings.clickSound &&
                            draftSoundSettings.effectsEnabled
                          }
                          onChange={(v) =>
                            setDraftSoundSettings((prev) => ({
                              ...prev,
                              clickSound: v,
                            }))
                          }
                          disabled={!draftSoundSettings.effectsEnabled}
                        />

                        {/* Message Sound Toggle */}
                        <ToggleRow
                          label="Message Notifications"
                          description="Play sound when new messages arrive."
                          checked={
                            draftSoundSettings.messageSound &&
                            draftSoundSettings.effectsEnabled
                          }
                          onChange={(v) =>
                            setDraftSoundSettings((prev) => ({
                              ...prev,
                              messageSound: v,
                            }))
                          }
                          disabled={!draftSoundSettings.effectsEnabled}
                        />
                      </div>
                    </div>
                  )}

                  {/* SECURITY */}
                  {activeSection === "security" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">
                          Security & Privacy
                        </h3>
                        <p className="text-sm text-base-content/65 mt-1">
                          Manage password and visibility preferences.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-md p-5 space-y-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold">
                              Show Online Status
                            </div>
                            <div className="text-xs text-base-content/65 mt-1">
                              {draftShowOnlineStatus
                                ? "Your UI shows you as online."
                                : "Your UI hides your online status."}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={draftShowOnlineStatus}
                            onChange={(e) =>
                              setDraftShowOnlineStatus(e.target.checked)
                            }
                            aria-label="Show Online Status"
                          />
                        </div>

                        <div className="pt-2 border-t border-base-300/60">
                          <button
                            className="btn btn-primary w-full"
                            onClick={() => setIsPasswordModalOpen(true)}
                            type="button"
                          >
                            <Lock className="size-4" />
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky Save Bar */}
                <div className="flex-shrink-0 sticky bottom-0 z-40">
                  {isDirty && (
                    <div className="border-t border-base-300/60 bg-base-100/85 backdrop-blur-md p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">
                            You have unsaved changes
                          </div>
                          <div className="text-xs text-base-content/65">
                            Save or reset your updates.
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={handleSave}
                            type="button"
                          >
                            <Save className="size-4" />
                            Save
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleReset}
                            type="button"
                          >
                            <RotateCcw className="size-4" />
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 backdrop-blur-md shadow-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Change Password</h3>
                  <p className="text-sm text-base-content/65 mt-1">
                    Use a strong password and never reuse old ones.
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsPasswordModalOpen(false)}
                  type="button"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form
                className="mt-4 space-y-4"
                onSubmit={handleChangePasswordSubmit}
              >
                <div>
                  <div className="text-sm font-semibold">Current Password</div>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold">New Password</div>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    Confirm New Password
                  </div>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="flex items-center gap-2 justify-end pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsPasswordModalOpen(false)}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OrbitalPageWrapper>
  );
};

export default SettingsPage;
