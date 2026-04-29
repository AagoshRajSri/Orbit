import { create } from "zustand";
import { getSocket } from "../lib/socket";
import { spotifyService } from "../services/spotifyService";

export const useSpotifyStore = create((set, get) => ({
  // Authentication & Credentials
  spotifyLinked: false,
  spotifyProfile: null,
  accessToken: null,

  // Playback State
  currentTrack: null,
  isPlaying: false,
  positionMs: 0,
  positionMsAtSync: 0,
  lastSyncTimestamp: null,
  durationMs: 0,
  isShuffle: false,
  repeatMode: 0, // 0: off, 1: context, 2: track
  devices: [],
  activeDevice: null,

  // Session State
  activeSession: null,
  sessionId: null,
  isHost: false,
  participants: [],
  mode: "solo", // solo, shared, ghost
  isGhostMode: false,

  // Sync Status
  syncStatus: "idle", // idle, synced, catching-up, out-of-sync
  syncVersion: 0,
  lastSyncAt: null,

  // UI State
  isLoading: false,
  error: null,
  showSessionModal: false,

  // Actions
  setSpotifyProfile: (profile) =>
    set({ spotifyLinked: !!profile, spotifyProfile: profile }),

  disconnectSpotify: async () => {
    try {
      await spotifyService.disconnect();
      get().reset();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setPlaybackState: (state) =>
    set({
      isPlaying: state.isPlaying,
      positionMs: state.positionMs,
      positionMsAtSync: state.positionMs,
      lastSyncTimestamp: Date.now(),
      durationMs: state.durationMs,
      isShuffle: state.isShuffle ?? get().isShuffle,
      repeatMode: state.repeatMode ?? get().repeatMode,
    }),

  setDevices: (devices) => set({ devices }),

  setActiveDevice: async (device) => {
    const { isPlaying } = get();
    try {
      await spotifyService.transferPlayback(device.id, isPlaying);
      set({ activeDevice: device, _lastLocalAction: Date.now() });
    } catch (error) {
      console.error("Transfer playback failed:", error);
      set({ activeDevice: device, _lastLocalAction: Date.now() }); // Still set locally
    }
  },

  setActiveSession: (session) => set({ activeSession: session }),

  setSessionId: (sessionId) => set({ sessionId }),

  setIsHost: (isHost) => set({ isHost }),

  setParticipants: (participants) => set({ participants }),

  setMode: (mode) => set({ mode }),

  setGhostMode: (isGhost) => set({ isGhostMode: isGhost }),

  setSyncStatus: (status) =>
    set({
      syncStatus: status,
      lastSyncAt: new Date(),
    }),

  setSyncVersion: (version) => set({ syncVersion: version }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setShowSessionModal: (show) => set({ showSessionModal: show }),

  // Playback Control Actions
  playTrack: async (context) => {
    const { activeDevice } = get();
    if (!activeDevice) throw new Error("No active device");

    set({ isPlaying: true, positionMsAtSync: get().positionMs, lastSyncTimestamp: Date.now(), _lastLocalAction: Date.now() });

    try {
      await spotifyService.play(activeDevice.id, context);
    } catch (error) {
      set({ isPlaying: false, error: error.message });
      throw error;
    }
  },

  pausePlayback: async () => {
    const { activeDevice } = get();
    if (!activeDevice) throw new Error("No active device");

    set({ isPlaying: false, positionMsAtSync: get().positionMs, lastSyncTimestamp: Date.now(), _lastLocalAction: Date.now() });

    try {
      await spotifyService.pause(activeDevice.id);
    } catch (error) {
      set({ isPlaying: true, error: error.message });
      throw error;
    }
  },

  skipNext: async () => {
    const { activeDevice } = get();
    if (!activeDevice) throw new Error("No active device");

    set({ _lastLocalAction: Date.now() });
    try {
      await spotifyService.next(activeDevice.id);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  skipPrevious: async () => {
    const { activeDevice } = get();
    if (!activeDevice) throw new Error("No active device");

    set({ _lastLocalAction: Date.now() });
    try {
      await spotifyService.previous(activeDevice.id);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  seekTo: async (positionMs) => {
    const { activeDevice } = get();
    if (!activeDevice) throw new Error("No active device");

    try {
      await spotifyService.seek(activeDevice.id, positionMs);
      set({ positionMs, positionMsAtSync: positionMs, lastSyncTimestamp: Date.now(), _lastLocalAction: Date.now() });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  setVolume: async (volumePercent) => {
    const { activeDevice } = get();
    if (!activeDevice) return; // Silent return if no device, as this is often spammed
    try {
      await spotifyService.setVolume(activeDevice.id, volumePercent);
      set({ _lastLocalAction: Date.now() });
    } catch (error) {
      console.error("Failed to set volume:", error);
    }
  },

  toggleShuffle: async () => {
    const { activeDevice, isShuffle } = get();
    if (!activeDevice) return;
    try {
      await spotifyService.setShuffle(activeDevice.id, !isShuffle);
      set({ isShuffle: !isShuffle, _lastLocalAction: Date.now() });
    } catch (error) {
      console.error("Failed to toggle shuffle:", error);
    }
  },

  cycleRepeat: async () => {
    const { activeDevice, repeatMode } = get();
    if (!activeDevice) return;
    const nextMode = (repeatMode + 1) % 3;
    const modes = ["off", "context", "track"];
    try {
      await spotifyService.setRepeat(activeDevice.id, modes[nextMode]);
      set({ repeatMode: nextMode, _lastLocalAction: Date.now() });
    } catch (error) {
      console.error("Failed to cycle repeat:", error);
    }
  },
  
  createPlaylist: async (name, description) => {
    try {
      const playlist = await spotifyService.createPlaylist(name, description);
      return playlist;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  sendHeartbeat: () => {
    const { sessionId, spotifyProfile } = get();
    if (!sessionId || !spotifyProfile) return;
    
    const socket = getSocket();
    socket.emit("spotify:heartbeat", { 
      sessionId, 
      userId: spotifyProfile.spotifyId 
    });
  },

  // Session Actions
  createSession: async (mode = "shared") => {
    try {
      set({ isLoading: true });
      const session = await spotifyService.createSession(mode);

      set({
        sessionId: session.sessionId,
        mode,
        isHost: true,
        participants: session.participants,
        activeSession: session,
        isLoading: false,
      });

      // Join session via WebSocket
      const socket = getSocket();
      socket.emit("spotify:join-session", {
        sessionId: session.sessionId,
        userId: get().spotifyProfile?.spotifyId,
      });

      return session;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  joinSession: async (sessionId, ghostMode = false) => {
    try {
      set({ isLoading: true });
      const session = await spotifyService.joinSession(sessionId, ghostMode);

      set({
        sessionId: session.sessionId,
        participants: session.participants,
        mode: ghostMode ? "ghost" : "shared",
        isGhostMode: ghostMode,
        activeSession: session,
        isLoading: false,
        syncStatus: "catching-up",
      });

      // Join session via WebSocket
      const socket = getSocket();
      socket.emit("spotify:join-session", {
        sessionId,
        userId: get().spotifyProfile?.spotifyId,
      });

      return session;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  _lastLocalAction: null,

  // Fetch from Spotify
  getPlaybackState: async () => {
    if (!get().spotifyLinked) return null;

    try {
      const state = await spotifyService.getPlaybackState();
      const localActionRecent = !!(get()._lastLocalAction && Date.now() - get()._lastLocalAction < 6000);
      
      if (!state) {
        if (!localActionRecent) set({ isPlaying: false });
        return null;
      }

      // Format track
      const track = state.item
        ? {
            id: state.item.id,
            uri: state.item.uri,
            name: state.item.name,
            artist: state.item.artists.map((a) => a.name).join(", "),
            imageUrl: state.item.album.images[0]?.url,
            duration_ms: state.item.duration_ms,
          }
        : null;

      if (!localActionRecent) {
        set({
          currentTrack: track,
          isPlaying: state.is_playing,
          positionMs: state.progress_ms,
          positionMsAtSync: state.progress_ms,
          lastSyncTimestamp: Date.now(),
          durationMs: state.item?.duration_ms || 0,
          isShuffle: state.shuffle_state,
          repeatMode: state.repeat_state === "track" ? 2 : state.repeat_state === "context" ? 1 : 0,
        });
      } else {
        // Optimistic Protection: Only update track identity and duration safely,
        // don't revert isPlaying, position, shuffle, or repeat yet
        set({
          currentTrack: track,
          durationMs: state.item?.duration_ms || 0,
          // We keep our local optimistic values for these during the window:
          // isPlaying, positionMs, isShuffle, repeatMode
        });
      }

      return {
        currentTrack: track,
        isPlaying: localActionRecent ? get().isPlaying : state.is_playing,
        positionMs: localActionRecent ? get().positionMs : state.progress_ms,
        durationMs: state.item?.duration_ms || 0,
        isShuffle: localActionRecent ? get().isShuffle : state.shuffle_state,
        repeatMode: localActionRecent ? get().repeatMode : (state.repeat_state === "track" ? 2 : state.repeat_state === "context" ? 1 : 0),
      };
    } catch (error) {
      console.error("Failed to get playback state:", error);
      return null;
    }
  },

  leaveSession: async () => {
    try {
      const { sessionId } = get();
      if (!sessionId) return;

      const socket = getSocket();
      socket.emit("spotify:leave-session", {
        sessionId,
        userId: get().spotifyProfile?.spotifyId,
      });

      await spotifyService.leaveSession(sessionId);

      set({
        sessionId: null,
        activeSession: null,
        participants: [],
        isHost: false,
        mode: "solo",
        syncStatus: "idle",
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  transferHost: async (newHostId) => {
    try {
      const { sessionId } = get();
      if (!sessionId) throw new Error("Not in a session");

      const socket = getSocket();
      socket.emit("spotify:transfer-host", {
        sessionId,
        currentHostId: "current-user-id",
        newHostId,
      });

      set({ isHost: false });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleGhostMode: async (ghostMode) => {
    try {
      const { sessionId } = get();
      if (!sessionId) throw new Error("Not in a session");

      const socket = getSocket();
      socket.emit("spotify:toggle-ghost", {
        sessionId,
        userId: "current-user-id",
        ghostMode,
      });

      set({ isGhostMode: ghostMode });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // WebSocket Listeners
  setupWebSocketListeners: () => {
    const socket = getSocket();

    socket.on("spotify:session-state", (data) => {
      set({
        activeSession: data,
        participants: data.participants,
        currentTrack: data.currentTrack,
        isPlaying: data.isPlaying,
        positionMs: data.positionMs,
        mode: data.mode,
        syncStatus: "synced",
      });
    });

    socket.on("spotify:playback-synced", (data) => {
      const { isHost } = get();
      if (isHost) return; // Don't sync own actions back

      // Basic latency check (approx. 100ms default if no timestamp)
      const adjustedPos = data.timestamp 
        ? data.positionMs + (Date.now() - new Date(data.timestamp).getTime())
        : data.positionMs + 100;

      set({
        currentTrack: data.currentTrack,
        isPlaying: data.isPlaying,
        positionMs: adjustedPos,
        positionMsAtSync: adjustedPos,
        lastSyncTimestamp: Date.now(),
        syncVersion: data.syncVersion,
        syncStatus: "synced",
      });
    });

    socket.on("spotify:state-reconcile", (data) => {
      set({
        isPlaying: data.isPlaying,
        positionMs: data.positionMs,
        positionMsAtSync: data.positionMs,
        lastSyncTimestamp: Date.now(),
        currentTrack: data.currentTrack,
        syncVersion: data.syncVersion,
        syncStatus: "synced",
      });
    });

    socket.on("spotify:participant-joined", (data) => {
      set({
        participants: data.participants,
      });
    });

    socket.on("spotify:participant-left", (data) => {
      set({
        participants: data.participants,
      });
    });

    socket.on("spotify:host-transferred", (data) => {
      set({
        isHost: false, // Update if this is you
      });
    });

    socket.on("spotify:session-ended", (data) => {
      set({
        sessionId: null,
        activeSession: null,
        participants: [],
        isHost: false,
        syncStatus: "idle",
      });
    });

    socket.on("spotify:error", (data) => {
      set({ error: data.message });
    });
  },

  reset: () =>
    set({
      spotifyLinked: false,
      spotifyProfile: null,
      currentTrack: null,
      isPlaying: false,
      positionMs: 0,
      activeSession: null,
      sessionId: null,
      isHost: false,
      participants: [],
      mode: "solo",
      syncStatus: "idle",
      error: null,
    }),

  // Polling Management
  _pollingInterval: null,
  startPolling: () => {
    if (get()._pollingInterval) return;
    
    // Setup WebSocket too if not already
    get().setupWebSocketListeners();

    if (!get().spotifyLinked) return;

    // Initial fetch
    get().getPlaybackState();

    const interval = setInterval(() => {
      if (get().spotifyLinked) {
        get().getPlaybackState();
      }
    }, 5000); // 5s polling is standard for dashboard players
    
    set({ _pollingInterval: interval });
  },

  stopPolling: () => {
    if (get()._pollingInterval) {
      clearInterval(get()._pollingInterval);
      set({ _pollingInterval: null });
    }
  },
}));
