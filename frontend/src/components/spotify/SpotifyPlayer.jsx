import React, { useEffect, useState, useRef } from "react";
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  Users,
  Search,
  Smartphone,
  Speaker,
  Loader,
  Heart,
  ListMusic,
  ChevronRight,
  Library,
  Disc,
  Clock,
  MoreHorizontal,
  Shuffle,
  Repeat,
  LayoutGrid,
  Plus,
  Mic2,
  Maximize2
} from "lucide-react";
import { useSpotifyStore } from "../../store/useSpotifyStore";
import { spotifyService } from "../../services/spotifyService";
import { useThemeStore } from "../../store/useThemeStore";
import toast from "react-hot-toast";

/**
 * Main Spotify Player Component
 */
export default function SpotifyPlayer() {
  const { spotifyLinked, activeDevice } = useSpotifyStore();
  const { theme } = useThemeStore();
  const isAmoled = theme === "amoled-dark";
  const clr = isAmoled ? "#4ECDC4" : "#1DB954";
  const [currentView, setView] = useState({ type: "top", id: null, title: "Your Favorites" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          setIsSearching(true);
          const tracks = await spotifyService.searchTracks(searchQuery);
          setSearchResults(tracks);
          setView({ type: "search", id: "search", title: `Results for "${searchQuery}"` });
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else if (searchQuery.length === 0 && currentView.type === "search") {
        setView({ type: "top", id: null, title: "Your Favorites" });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!spotifyLinked) {
    return <SpotifyLoginPrompt />;
  }

  // If no device is active, show selector
  if (!activeDevice) {
    return <DeviceSelector />;
  }

  return (
    <div className={`flex h-full flex-col ${isAmoled ? "bg-[#000]" : "bg-[#121212]"} overflow-hidden text-white font-sans selection:bg-[#4ECDC4]/30`}>
      <div className="flex flex-1 min-h-0">
        <SpotifySidebar currentView={currentView} setView={setView} />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${isAmoled ? "bg-gradient-to-b from-[#050505] to-[#000]" : "bg-gradient-to-b from-[#1e1e1e] to-[#121212]"} relative overflow-hidden`}>
          {/* Top Bar with Search */}
          <div className="flex-shrink-0 p-4 flex items-center gap-4 bg-black/10 backdrop-blur-sm z-20 border-b border-white/5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search all Spotify songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#242424] hover:bg-[#2a2a2a] border-none rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors"
              />
            </div>
            <DeviceIndicator />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth">
            <ContentRenderer view={currentView} setView={setView} results={searchResults} />
          </div>
        </div>
      </div>
      <NowPlayingBar />
      <ErrorBanner />
    </div>
  );
}

/**
 * Device Selector
 */
function DeviceSelector() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkStatus, setSdkStatus] = useState("idle"); // idle | loading | ready | failed
  const [sdkDeviceId, setSdkDeviceId] = useState(null);
  const playerRef = useRef(null);
  const { setActiveDevice } = useSpotifyStore();

  // ── Step 1: Try Web Playback SDK ──
  useEffect(() => {
    initSDK();
    // Also load external devices in parallel
    loadDevices();
  }, []);

  const initSDK = async () => {
    try {
      setSdkStatus("loading");
      const tokenRes = await spotifyService.getAccessToken();
      const token = tokenRes?.access_token || tokenRes?.accessToken || tokenRes;
      if (!token) throw new Error("No token");

      // Inject Spotify SDK script if not already present
      if (!window.Spotify) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          document.body.appendChild(script);
          window.onSpotifyWebPlaybackSDKReady = resolve;
          script.onerror = reject;
          setTimeout(reject, 10000); // 10s timeout
        });
      }

      const player = new window.Spotify.Player({
        name: "Orbit 🌌",
        getOAuthToken: (cb) => cb(token),
        volume: 0.7,
      });
      playerRef.current = player;

      player.addListener("ready", ({ device_id }) => {
        setSdkDeviceId(device_id);
        setSdkStatus("ready");
        // Auto-select this in-browser device
        setActiveDevice({ id: device_id, name: "Orbit Browser", type: "Computer", is_active: true });
      });

      player.addListener("not_ready", () => setSdkStatus("failed"));
      player.addListener("initialization_error", () => setSdkStatus("failed"));
      player.addListener("authentication_error", () => setSdkStatus("failed"));
      player.addListener("account_error", () => {
        setSdkStatus("failed");
        toast.error("Spotify Premium required for in-browser playback.");
      });

      await player.connect();
    } catch (err) {
      setSdkStatus("failed");
    }
  };

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const devList = await spotifyService.getDevices();
      setDevices(devList || []);
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDevice = (device) => setActiveDevice(device);

  const openSpotify = () => {
    window.open("https://open.spotify.com", "_blank");
    toast("Opening Spotify — come back and hit Refresh! 🎵", { icon: "🎵" });
  };

  // If SDK succeeded, the device was auto-selected and the player renders
  if (sdkStatus === "ready") return null;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-3xl shadow-2xl p-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Glow effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#1DB954]/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#1DB954]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="h-16 w-16 mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1DB954] to-[#1ed760] shadow-lg shadow-green-500/20">
            <Speaker className="w-8 h-8 text-black" />
          </div>

          {/* SDK status */}
          {sdkStatus === "loading" && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20">
              <Loader className="w-4 h-4 animate-spin text-[#1DB954] flex-shrink-0" />
              <div>
                <p className="text-[11px] font-black text-[#1DB954] uppercase tracking-widest">Starting Orbit Player</p>
                <p className="text-[10px] text-white/30 mt-0.5">Connecting Web Playback SDK...</p>
              </div>
            </div>
          )}

          {sdkStatus === "failed" && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-sm flex-shrink-0">⚠</span>
              <div>
                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">In-browser player unavailable</p>
                <p className="text-[10px] text-white/30 mt-0.5">Spotify Premium required · Select a device below</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight text-white mb-2">
            Connect a device
          </h1>
          <p className="text-white/40 text-sm mb-6 leading-relaxed font-medium">
            Select an active Spotify device or open Spotify on this computer.
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader className="w-8 h-8 animate-spin text-[#1DB954]" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">
                Scanning for devices...
              </span>
            </div>
          ) : devices.length > 0 ? (
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => selectDevice(device)}
                  className="group w-full p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-[#1DB954]/10 hover:border-[#1DB954]/50 transition-colors duration-300 flex items-center gap-4 text-left"
                >
                  <div className={`p-3 rounded-xl ${device.is_active ? "bg-[#1DB954] text-black" : "bg-white/5 text-white/40 group-hover:bg-[#1DB954]/20 group-hover:text-[#1DB954]"}`}>
                    {device.type === "Smartphone" ? <Smartphone className="w-5 h-5" /> : <Speaker className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{device.name}</p>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{device.type}</p>
                  </div>
                  {device.is_active && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-[#1DB954] uppercase tracking-[0.15em]">Live</span>
                      <div className="h-2 w-2 rounded-full bg-[#1DB954] animate-pulse" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center rounded-2xl border border-dashed border-white/10 mb-6">
              <p className="text-white/40 text-sm mb-4 px-4 font-medium">
                No active devices found.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={openSpotify}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-sm transition-all shadow-lg shadow-green-500/30 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.352-.674.463-1.025.249-2.857-1.745-6.452-2.14-10.686-1.171-.403.092-.806-.162-.899-.565-.092-.402.162-.806.565-.898 4.636-1.06 8.607-.611 11.796 1.338.351.214.463.673.249 1.047zm1.467-3.257c-.271.442-.846.582-1.288.311-3.27-2.007-8.256-2.589-12.122-1.416-.499.151-1.023-.133-1.174-.633-.151-.499.133-1.023.633-1.174 4.417-1.34 9.909-.691 13.639 1.602.443.271.583.847.312 1.31zm.126-3.411c-3.922-2.329-10.395-2.545-14.153-1.405-.6.181-1.237-.161-1.418-.761-.181-.6.161-1.237.761-1.418 4.304-1.306 11.455-1.053 15.986 1.636.539.319.715 1.014.396 1.553-.319.539-1.014.715-1.572.395z"/>
              </svg>
              Open Spotify on this device
            </button>
            <button
              onClick={loadDevices}
              className="w-full px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all border border-white/10"
            >
              ↻ Refresh Device List
            </button>
          </div>

          <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">
            <span>Powered by Spotify Engine</span>
            <Disc className="w-4 h-4 animate-spin-slow opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Spotify Player UI - The "Mini Spotify"
 */
function DeviceIndicator() {
  const { activeDevice, setDevices } = useSpotifyStore();
  const [isOpen, setIsOpen] = useState(false);

  const loadDevices = async () => {
    try {
      const devices = await spotifyService.getDevices();
      setDevices(devices);
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadDevices();
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${activeDevice ? "text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/30 hover:bg-[#1DB954]/20" : "text-white/40 hover:text-white bg-white/5 border-transparent"
          }`}
      >
        <Speaker className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.1em] hidden sm:inline">
          {activeDevice ? activeDevice.name : "Select Output"}
        </span>
      </button>

      {/* Mini Device Selector Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#282828] rounded-2xl shadow-2xl border border-white/10 z-[100] p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Active Outputs</span>
            <button onClick={loadDevices} className="text-[#1DB954] hover:text-[#1ed760] transition-colors"><Plus className="w-4 h-4 rotate-45" /></button>
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar pr-1">
            <DeviceList hideHeader />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Error Banner
 */
function ErrorBanner() {
  const { error, setError } = useSpotifyStore();
  if (!error) return null;

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 z-[100] px-4">
      <div className="bg-red-500/95 backdrop-blur-xl text-white py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-between border border-white/20">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-white/20">
            <span className="text-sm font-black">!</span>
          </div>
          <p className="text-xs font-bold leading-tight">{error}</p>
        </div>
        <button
          onClick={() => setError(null)}
          className="text-white/60 hover:text-white transition-colors p-2"
        >
          <Plus className="w-5 h-5 rotate-45" />
        </button>
      </div>
    </div>
  );
}

/**
 * Content Renderer - Decides what to show in main area
 */
function ContentRenderer({ view, setView, results }) {
  if (view.type === "search") {
    return <TracksList title={view.title} tracks={results} />;
  }
  if (view.type === "liked") {
    return <LikedTracks />;
  }
  if (view.type === "playlist") {
    return <PlaylistTracks playlistId={view.id} title={view.title} />;
  }
  return <RecentlyPlayed />;
}

/**
 * Sidebar Navigation
 */
function SpotifySidebar({ currentView, setView }) {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createPlaylist } = useSpotifyStore();

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true);
      const list = await spotifyService.getPlaylists();
      setPlaylists(list);
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    const name = prompt("Enter Orbit Playlist Name:");
    if (!name) return;

    try {
      setIsLoading(true);
      await createPlaylist(name);
      await fetchPlaylists();
      toast.success("Playlist created in Orbit");
    } catch (error) {
      toast.error("Failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const { theme } = useThemeStore();
  const isAmoled = theme === "amoled-dark";
  const clr = isAmoled ? "#4ECDC4" : "#1DB954";

  return (
    <div className={`w-72 border-r ${isAmoled ? "border-white/5 bg-[#020202]" : "border-white/5 bg-black"} flex flex-col flex-shrink-0 animate-in fade-in duration-500`}>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group cursor-default">
          <div className={`h-10 w-10 rounded-xl ${isAmoled ? "bg-[#4ECDC4]/10 border-[#4ECDC4]/20 shadow-[0_0_15px_rgba(78,205,196,0.1)]" : "bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"} flex items-center justify-center border group-hover:border-[${clr}]/40 transition-colors`}>
            <LayoutGrid className={`w-5 h-5 ${isAmoled ? "text-[#4ECDC4]" : "text-[#1DB954]"}`} />
          </div>
          <span className={`text-sm font-black text-white/90 tracking-[0.1em] uppercase ${isAmoled ? "font-['Orbitron']" : ""}`}>Orbit Core</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setView({ type: "top", id: null, title: "Dashboard" })}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${currentView.type === "top" ? "bg-white/10 text-white shadow-inner" : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
          >
            <Disc className={`w-5 h-5 ${currentView.type === "top" ? "text-[#1DB954] animate-spin-slow" : "text-white/40"}`} />
            <span className="text-xs font-black uppercase tracking-widest">Dash</span>
          </button>

          <button
            onClick={() => setView({ type: "liked", id: null, title: "Liked Songs" })}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${currentView.type === "liked" ? "bg-white/10 text-white shadow-inner" : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
          >
            <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Heart className={`w-3.5 h-3.5 ${currentView.type === "liked" ? "fill-white text-white" : "text-white"}`} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Liked</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <div className="px-2 mb-4 flex items-center justify-between group">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Orbital Streams</span>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader className="w-3 h-3 animate-spin text-white/20" />
            ) : (
              <button
                onClick={handleCreatePlaylist}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-[#1DB954] transition-all opacity-0 group-hover:opacity-100 bg-white/5"
                title="Create Entry"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {playlists.length === 0 && !isLoading ? (
            <div className="px-4 py-10 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.1em] mb-2 leading-relaxed">No active streams detected</p>
              <button
                onClick={fetchPlaylists}
                className="text-[9px] text-[#1DB954] font-black uppercase tracking-widest hover:underline"
              >
                Sync Terminal
              </button>
            </div>
          ) : (
            playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => setView({ type: "playlist", id: pl.id, title: pl.name })}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all group ${currentView.id === pl.id ? "bg-white/10 text-white border border-white/10" : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                {pl.images?.[0]?.url ? (
                  <img loading="lazy" decoding="async" src={pl.images[0].url} className="h-10 w-10 rounded-lg flex-shrink-0 object-cover shadow-lg" alt="" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                    <ListMusic className="w-5 h-5 opacity-40" />
                  </div>
                )}
                <div className="text-left min-w-0">
                  <p className="text-xs font-black truncate text-white/90">{pl.name}</p>
                  <p className="text-[10px] text-white/30 truncate font-medium mt-0.5 tracking-tighter">By {pl.owner?.display_name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Liked Tracks View
 */
function LikedTracks() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        setIsLoading(true);
        const items = await spotifyService.getLikedSongs();
        setTracks(items.map(item => item.track));
      } catch (error) {
        console.error("Failed to fetch liked:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiked();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#1DB954]" />
      </div>
    );
  }

  return <TracksList title="Liked Collection" tracks={tracks} headerGradient="from-indigo-900/40" icon={<Heart className="w-16 h-16 fill-white text-white" />} />;
}

/**
 * Playlist Tracks View
 */
function PlaylistTracks({ playlistId, title }) {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const items = await spotifyService.getPlaylistTracks(playlistId);
      setTracks(items.map(item => item.track));
    } catch (error) {
      console.error("Failed to fetch playlist tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [playlistId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#1DB954]" />
      </div>
    );
  }

  return <TracksList title={title} tracks={tracks} playlistId={playlistId} onTracksUpdated={fetchTracks} icon={<ListMusic className="w-16 h-16 text-white" />} />;
}

/**
 * Recently Played Tracks
 */
function RecentlyPlayed() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setIsLoading(true);
        const items = await spotifyService.getRecentlyPlayed();
        setTracks(items.map(item => item.track));
      } catch (error) {
        console.error("Failed to fetch recent:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const { theme } = useThemeStore();
  const isAmoled = theme === "amoled-dark";
  const clr = isAmoled ? "#4ECDC4" : "#1DB954";

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className={`w-10 h-10 animate-spin text-[${clr}]`} />
      </div>
    );
  }

  return <TracksList title="Recent Echoes" tracks={tracks} headerGradient={isAmoled ? "from-[#4ECDC4]/10" : "from-green-900/30"} icon={<Clock className="w-16 h-16 text-white" />} />;
}

/**
 * Generic Tracks List component
 */
function TracksList({ title, tracks, playlistId, onTracksUpdated, headerGradient = "from-[#1DB954]/20", icon }) {
  const { playTrack } = useSpotifyStore();
  const { theme } = useThemeStore();
  const isAmoled = theme === "amoled-dark";
  const clr = isAmoled ? "#4ECDC4" : "#1DB954";
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(null); // track uri to add
  const [userPlaylists, setUserPlaylists] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const list = await spotifyService.getPlaylists();
      setUserPlaylists(list);
    };
    if (showPlaylistPicker) fetchPlaylists();
  }, [showPlaylistPicker]);

  const handlePlay = (track) => {
    playTrack({ uris: [track.uri] });
  };

  const handleAddBack = async (targetPlaylistId) => {
    try {
      await spotifyService.addTrackToPlaylist(targetPlaylistId, showPlaylistPicker);
      toast.success("Added to playlist");
      setShowPlaylistPicker(null);
      if (onTracksUpdated && targetPlaylistId === playlistId) onTracksUpdated();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Header */}
      <div className={`p-10 bg-gradient-to-b ${isAmoled ? "from-[#4ECDC4]/10" : headerGradient} to-transparent flex items-end gap-10 mb-8 border-b border-white/5`}>
        <div className="h-56 w-56 shadow-2xl rounded-2xl bg-black/60 backdrop-blur-3xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10 relative group">
          <div className={`absolute inset-0 ${isAmoled ? "bg-[#4ECDC4]/10" : "bg-green-500/10"} opacity-0 group-hover:opacity-100 transition-opacity`} />
          {icon || <Disc className={`w-28 h-28 text-white/5 animate-spin-slow ${isAmoled ? "group-hover:text-[#4ECDC4]/20" : ""}`} />}
        </div>
        <div className="pb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Transmission</p>
          <h2 className="text-7xl font-black text-white tracking-tighter mb-6 leading-none">{title}</h2>
          <div className="flex items-center gap-4 text-xs font-black text-white/40 uppercase tracking-widest">
            <span className="text-white">Orbit Sync</span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5" />
              {tracks.length} fragments
            </span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-10 mb-6">
        <div className="grid grid-cols-[3.5rem_1fr_1fr_4rem_3rem] gap-6 px-6 py-3 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          <span className="text-center">#</span>
          <span>Fragment</span>
          <span className="hidden md:inline">Source Archive</span>
          <span className="flex justify-end"><Clock className="w-3.5 h-3.5" /></span>
          <span className="text-right"></span>
        </div>
      </div>

      {/* List */}
      <div className="px-10">
        {tracks.length === 0 ? (
          <div className="py-24 text-center rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
            <Music className="w-20 h-20 text-white/5 mx-auto mb-6" />
            <p className="text-white/30 font-black uppercase tracking-[0.3em] text-xs">Terminal Empty. No data fragments found.</p>
          </div>
        ) : (
          <div className="grid gap-1">
            {tracks.map((track, idx) => {
              if (!track) return null;
              return (
                <div
                  key={track.id || idx}
                  onClick={() => handlePlay(track)}
                  className="grid grid-cols-[3.5rem_1fr_1fr_4rem_3rem] gap-6 px-6 py-4 rounded-2xl hover:bg-white/[0.04] transition-all group cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-black text-white/20 group-hover:hidden transition-colors w-4">{idx + 1}</span>
                    <Play className={`w-5 h-5 ${isAmoled ? "text-[#4ECDC4]" : "text-[#1DB954]"} hidden group-hover:block fill-current`} />
                  </div>

                  <div className="flex items-center gap-5 min-w-0">
                    {track.album?.images?.[0]?.url && (
                      <img loading="lazy" decoding="async" src={track.album.images[0].url} className="h-12 w-12 rounded-lg shadow-xl" alt="" />
                    ) || (
                        <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                          <Music className="w-6 h-6 text-white/10" />
                        </div>
                      )}
                    <div className="min-w-0">
                      <p className={`text-sm font-black text-white truncate hover:text-[${clr}] transition-colors leading-tight ${isAmoled ? "font-['Orbitron']" : ""}`}>
                        {track.name}
                      </p>
                      <p className={`text-[11px] text-white/40 font-bold truncate mt-1 ${isAmoled ? "font-['Rajdhani']" : ""}`}>
                        {track.artists?.map(a => a.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center min-w-0">
                    <p className="text-xs text-white/30 font-bold truncate">{track.album?.name}</p>
                  </div>

                  <div className="flex items-center justify-end">
                    <span className="text-[11px] text-white/20 font-black tracking-widest tabular-nums">
                      {Math.floor(track.duration_ms / 60000)}:
                      {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowPlaylistPicker(track.uri); }}
                      className="p-2 rounded-xl text-white/10 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Playlist Picker Modal Overlay */}
      {showPlaylistPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#181818] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Target Playlist</h3>
              <button
                onClick={() => setShowPlaylistPicker(null)}
                className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {userPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAddBack(pl.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    {pl.images?.[0]?.url ? <img loading="lazy" decoding="async" src={pl.images[0].url} className="h-full w-full object-cover rounded-lg" /> : <ListMusic className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-bold text-white/70 group-hover:text-[#1DB954] transition-colors">{pl.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bottom Player Bar
 * Updated with Spotify-accurate styling and interaction
 */
function NowPlayingBar() {
  const {
    currentTrack, isPlaying, positionMs, durationMs,
    isShuffle, repeatMode,
    skipNext, skipPrevious, pausePlayback, playTrack, seekTo,
    toggleShuffle, cycleRepeat, sendHeartbeat, sessionId
  } = useSpotifyStore();

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, [sessionId, sendHeartbeat]);

  const [volume, setVolume] = useState(70);
  const [localSeek, setLocalSeek] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  // Auto-progress simulation for smooth UI feel between updates
  const [animatedPos, setAnimatedPos] = useState(positionMs);

  useEffect(() => {
    setAnimatedPos(positionMs);
  }, [positionMs]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setAnimatedPos(prev => Math.min(prev + 1000, durationMs));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  const progress = localSeek !== null ? localSeek : (durationMs ? (animatedPos / durationMs) * 100 : 0);

  const formatTime = (ms) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedP = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newPos = (clickedP / 100) * durationMs;
    seekTo(newPos);
  };

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVol = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    setVolume(newVol);

    // Connect to Spotify API
    const { activeDevice } = useSpotifyStore.getState();
    if (activeDevice?.id) {
      spotifyService.setVolume(activeDevice.id, newVol);
    }
  };

  const { theme } = useThemeStore();
  const isAmoled = theme === "amoled-dark";
  const clr = isAmoled ? "#4ECDC4" : "#1DB954";

  return (
    <div className={`h-28 ${isAmoled ? "bg-[#000]" : "bg-[#090909]"} border-t border-white/5 px-8 flex items-center justify-between relative z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${isAmoled ? "bg-black/95" : "bg-black/90"}`}>
      {/* Current Track Info */}
      <div className="w-[30%] flex items-center gap-6 group">
        {currentTrack ? (
          <>
            <div className={`h-16 w-16 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative flex-shrink-0 border ${isAmoled ? "border-[#4ECDC4]/20" : "border-white/10"} group`}>
              <img loading="lazy" decoding="async" src={currentTrack.imageUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-black text-white/90 truncate hover:text-[${clr}] cursor-pointer transition-colors leading-none mb-2 ${isAmoled ? "font-['Orbitron'] letter-spacing-[1px]" : ""}`}>{currentTrack.name}</p>
              <p className="text-[11px] font-bold text-white/30 truncate hover:text-white/60 cursor-pointer transition-colors uppercase tracking-tight">{currentTrack.artist}</p>
            </div>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`transition-all p-3 rounded-full hover:bg-white/5 ${isLiked ? (isAmoled ? 'text-[#4ECDC4]' : 'text-[#1DB954]') : 'text-white/20 hover:text-white'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/5" />
            <div className="space-y-3">
              <div className="h-3 w-40 bg-white/[0.03] rounded animate-pulse" />
              <div className="h-2 w-24 bg-white/[0.02] rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Main Controls - Center */}
      <div className="flex-1 max-w-xl flex flex-col items-center gap-4">
        <div className="flex items-center gap-8">
          <button
            onClick={toggleShuffle}
            className={`transition-colors p-2 ${isShuffle ? (isAmoled ? 'text-[#4ECDC4] glow-cyan-sm' : 'text-[#1DB954] glow-green-sm') : 'text-white/20 hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button onClick={skipPrevious} className="text-white/40 hover:text-white transition-all transform active:scale-90 hover:scale-110">
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={() => isPlaying ? pausePlayback() : playTrack()}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-white/20"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>

          <button onClick={skipNext} className="text-white/40 hover:text-white transition-all transform active:scale-90 hover:scale-110">
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`transition-colors relative p-2 ${repeatMode > 0 ? (isAmoled ? 'text-[#4ECDC4] glow-cyan-sm' : 'text-[#1DB954] glow-green-sm') : 'text-white/20 hover:text-white'}`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 2 && (
              <span className={`absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full ${isAmoled ? 'bg-[#4ECDC4]' : 'bg-[#1DB954]'} text-[7px] font-black text-black ring-2 ring-black`}>1</span>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-4 group h-5">
          <span className="text-[10px] font-black text-white/20 w-12 text-right tabular-nums tracking-widest">{formatTime(animatedPos)}</span>
          <div
            onClick={handleSeek}
            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative transition-all group-hover:h-2"
          >
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-colors`}
              style={{ width: `${progress}%`, backgroundColor: clr, boxShadow: `0 0 10px ${clr}50` }}
            />
            <div
              className="absolute h-4 w-4 bg-white rounded-full -top-1.5 shadow-2xl ring-4 ring-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: '-8px' }}
            />
          </div>
          <span className="text-[10px] font-black text-white/20 w-12 tabular-nums tracking-widest">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Extras - Right */}
      <div className="w-[30%] flex items-center justify-end gap-6">
        <button className="text-white/20 hover:text-white transition-colors" title="Lyrics">
          <Mic2 className="w-5 h-5" />
        </button>
        <button className="text-white/20 hover:text-white transition-colors" title="Queue">
          <ListMusic className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 group w-40 ml-2">
          <Volume2 className={`w-5 h-5 text-white/20 group-hover:text-[${clr}] transition-colors`} />
          <div
            onClick={handleVolume}
            className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative group-hover:h-1.5 transition-all"
          >
            <div className="absolute left-0 top-0 h-full bg-white group-hover:bg-current rounded-full" style={{ width: `${volume}%`, color: clr }} />
            <div className={`absolute h-3 w-3 bg-white rounded-full -top-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`} style={{ left: `${volume}%`, marginLeft: '-6px' }} />
          </div>
        </div>
        <button className="text-white/20 hover:text-white transition-colors" title="More">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

/**
 * Login Prompt component
 */
function SpotifyLoginPrompt() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await spotifyService.initiateLogin();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-black p-6">
      <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-700">
        <div className="h-24 w-24 mx-auto mb-10 flex items-center justify-center rounded-[2rem] bg-[var(--spotify-primary)] shadow-[0_20px_50px_rgba(124,58,237,0.2)] border border-pink-400/20">
          <Music className="w-12 h-12 text-black" />
        </div>
        <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-none">Orbit Terminal</h2>
        <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium px-8">
          Integrate your Spotify biometric frequency to sync music across the orbital network.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-white/10 disabled:opacity-50"
        >
          {isLoading ? "Synchronizing..." : "Initiate Link"}
        </button>
      </div>
    </div>
  );
}

function DeviceList({ hideHeader }) {
  const [devices, setDevices] = useState([]);
  const { setActiveDevice, activeDevice } = useSpotifyStore();

  useEffect(() => {
    spotifyService.getDevices().then(setDevices);
  }, []);

  return (
    <div className="space-y-1">
      {devices.map(device => (
        <button
          key={device.id}
          onClick={() => setActiveDevice(device)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${activeDevice?.id === device.id ? "bg-[var(--spotify-primary)]/10 border-[var(--spotify-primary)]/20 text-[var(--spotify-primary)]" : "hover:bg-white/5 border-transparent text-white/40"
            }`}
        >
          {device.type === "Smartphone" ? <Smartphone className="w-4 h-4" /> : <Speaker className="w-4 h-4" />}
          <div className="min-w-0 text-left">
            <p className="text-xs font-black truncate">{device.name}</p>
            <p className="text-[9px] uppercase tracking-widest font-bold opacity-60">{device.type}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
