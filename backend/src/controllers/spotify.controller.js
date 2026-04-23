import { SpotifyCredential } from "../models/spotifyCredential.model.js";
import { spotifyService } from "../lib/spotify.js";

/**
 * Generate OAuth authorization URL
 */
export const getAuthorizationUrl = (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const url = spotifyService.getAuthorizationUrl(state);

    req.session = req.session || {};
    req.session.spotifyState = state;

    res.json({ authUrl: url });
  } catch (error) {
    console.error("Failed to generate auth URL:", error);
    res.status(500).json({ error: "Failed to generate authorization URL" });
  }
};

/**
 * Handle direct browser login request and redirect to Spotify
 */
export const login = (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const url = spotifyService.getAuthorizationUrl(state);

    // Store state in a cookie for verification (24 hour expiry)
    res.cookie("spotify_auth_state", state, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });

    res.redirect(url);
  } catch (error) {
    console.error("Failed to initiate Spotify login redirect:", error);
    res.status(500).json({ error: "Failed to initiate Spotify login" });
  }
};

/**
 * Handle OAuth callback from Spotify
 */
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code, state, error: spotifyError } = req.query;
    const userId = req.user?._id;

    // Handle Spotify OAuth errors (user denied, etc.)
    if (spotifyError) {
      console.log(`[Spotify OAuth] User denied or error: ${spotifyError}`);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/spotify?error=${encodeURIComponent(spotifyError)}`);
    }

    if (!code) {
      return res.status(400).json({ success: false, error: "No authorization code provided" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated", redirect: "/login" });
    }

    // Exchange code for access token
    const { accessToken, refreshToken, expiresIn } =
      await spotifyService.exchangeCodeForToken(code);

    // Get Spotify user profile using fresh access token (not from credentials lookup)
    const spotifyProfile =
      await spotifyService.getUserProfileWithToken(accessToken);

    // Store or update credentials
    let credential = await SpotifyCredential.findOne({ userId });

    if (credential) {
      credential.accessToken = accessToken;
      credential.refreshToken = refreshToken;
      credential.expiresAt = new Date(Date.now() + expiresIn * 1000);
      credential.spotifyId = spotifyProfile.id;
      credential.displayName = spotifyProfile.display_name;
      credential.email = spotifyProfile.email;
      credential.profileImage =
        spotifyProfile.images?.[0]?.url || credential.profileImage;
    } else {
      credential = new SpotifyCredential({
        userId,
        spotifyId: spotifyProfile.id,
        displayName: spotifyProfile.display_name,
        email: spotifyProfile.email,
        profileImage: spotifyProfile.images?.[0]?.url,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      });
    }

    await credential.save();

    console.log(`[Spotify Link] Success: Account ${spotifyProfile.display_name} linked to user ${userId}`);

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/spotify?connected=true`);
  } catch (error) {
    console.error("Spotify OAuth callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/spotify?error=${encodeURIComponent(error.message || "Failed to link Spotify")}`);
  }
};

/**
 * Disconnect Spotify account
 */
export const disconnectSpotify = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    await SpotifyCredential.deleteOne({ userId });

    res.json({
      success: true,
      message: "Spotify account disconnected",
    });
  } catch (error) {
    console.error("Failed to disconnect Spotify:", error);
    res.status(500).json({
      error: "Failed to disconnect Spotify account",
    });
  }
};

/**
 * Get current Spotify profile
 */
export const getSpotifyProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const credential = await SpotifyCredential.findOne({ userId });

    if (!credential) {
      return res
        .status(200)
        .json({ error: "Spotify account not linked", linked: false });
    }

    res.json({
      linked: true,
      profile: {
        spotifyId: credential.spotifyId,
        displayName: credential.displayName,
        email: credential.email,
        profileImage: credential.profileImage,
        lastSyncedAt: credential.lastSyncedAt,
      },
    });
  } catch (error) {
    console.error("Failed to get Spotify profile:", error);
    res.status(500).json({ error: "Failed to fetch Spotify profile" });
  }
};

/**
 * Get access token for Web Playback SDK
 */
export const getAccessToken = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const token = await spotifyService.ensureValidToken(userId);
    res.json({ accessToken: token });
  } catch (error) {
    console.error("Failed to get access token:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get currently playing track
 */
export const getCurrentlyPlaying = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const currentTrack = await spotifyService.getCurrentlyPlaying(userId);

    res.json({
      success: true,
      currentTrack,
    });
  } catch (error) {
    console.error("Failed to get currently playing:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get playback state
 */
export const getPlaybackState = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const state = await spotifyService.getPlaybackState(userId);

    res.json({
      success: true,
      state,
    });
  } catch (error) {
    if (error.message === "Spotify credentials not found") {
      return res.status(200).json({ success: true, state: null, linked: false });
    }
    console.error("Failed to get playback state:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get available devices
 */
export const getDevices = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const devices = await spotifyService.getDevices(userId);

    res.json({
      success: true,
      devices,
    });
  } catch (error) {
    console.error("Failed to get devices:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Play track
 */
export const play = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId, context } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    await spotifyService.play(userId, deviceId, context);

    res.json({ success: true, message: "Playback started" });
  } catch (error) {
    console.error("Failed to play:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Pause track
 */
export const pause = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    await spotifyService.pause(userId, deviceId);

    res.json({ success: true, message: "Playback paused" });
  } catch (error) {
    console.error("Failed to pause:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Skip to next
 */
export const next = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    await spotifyService.nextTrack(userId, deviceId);

    res.json({ success: true, message: "Skipped to next" });
  } catch (error) {
    console.error("Failed to skip:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Skip to previous
 */
export const previous = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    await spotifyService.previousTrack(userId, deviceId);

    res.json({ success: true, message: "Skipped to previous" });
  } catch (error) {
    console.error("Failed to skip:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Seek to position
 */
export const seek = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId, positionMs } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    if (typeof positionMs !== "number") {
      return res.status(400).json({ error: "Position in ms required" });
    }

    await spotifyService.seek(userId, deviceId, positionMs);

    res.json({ success: true, message: "Seeked to position" });
  } catch (error) {
    console.error("Failed to seek:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user playlists
 */
export const setVolume = async (req, res) => {
  const { deviceId, volumePercent } = req.body;
  try {
    const data = await spotifyService.setVolume(req.user._id, deviceId, volumePercent);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Set repeat mode
 */
export const setRepeatMode = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId, state } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!state) {
      return res.status(400).json({ error: "Repeat state required (off, track, context)" });
    }

    await spotifyService.setRepeatMode(userId, deviceId, state);
    res.json({ success: true, message: `Repeat mode set to ${state}` });
  } catch (error) {
    console.error("Failed to set repeat mode:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Set shuffle mode
 */
export const setShuffle = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId, state } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (typeof state !== "boolean") {
      return res.status(400).json({ error: "Shuffle state (boolean) required" });
    }

    await spotifyService.setShuffle(userId, deviceId, state);
    res.json({ success: true, message: `Shuffle mode set to ${state}` });
  } catch (error) {
    console.error("Failed to set shuffle mode:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const playlists = await spotifyService.getPlaylists(userId);
    console.log(`Fetched ${playlists.length} playlists for user ${userId}`);
    res.json({ success: true, playlists });
  } catch (error) {
    console.error("Failed to get playlists:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user liked songs
 */
export const getLikedSongs = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const songs = await spotifyService.getLikedSongs(userId);
    console.log(`Fetched ${songs.length} liked songs for user ${userId}`);
    res.json({ success: true, songs });
  } catch (error) {
    console.error("Failed to get liked songs:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get playlist tracks
 */
export const getPlaylistTracks = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { playlistId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const tracks = await spotifyService.getPlaylistTracks(userId, playlistId);
    res.json({ success: true, tracks });
  } catch (error) {
    console.error("Failed to get playlist tracks:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search tracks
 */
export const searchTracks = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { q, limit } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const results = await spotifyService.search(userId, q, "track", parsedLimit);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createPlaylist = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { name, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!name) {
      return res.status(400).json({ error: "Playlist name required" });
    }

    const playlist = await spotifyService.createPlaylist(userId, name, description);
    res.json({ success: true, playlist });
  } catch (error) {
    console.error("Failed to create playlist:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add tracks to a playlist
 */
/**
 * Add tracks to a playlist
 */
export const addTrackToPlaylist = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { playlistId } = req.params;
    const { uris } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!playlistId || !uris || !Array.isArray(uris)) {
      return res.status(400).json({ error: "Playlist ID and Track URIs array required" });
    }

    const data = await spotifyService.addTracksToPlaylist(userId, playlistId, uris);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Failed to add track to playlist:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get recently played tracks
 */
export const getRecentlyPlayed = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const data = await spotifyService.getRecentlyPlayed(userId);
    res.json({ success: true, tracks: data.items || [] });
  } catch (error) {
    console.error("Failed to get recently played:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Transfer playback to another device
 */
export const transferPlayback = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { deviceId, play } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    await spotifyService.transferPlayback(userId, deviceId, play);
    res.json({ success: true, message: "Playback transferred" });
  } catch (error) {
    console.error("Failed to transfer playback:", error);
    res.status(500).json({ error: error.message });
  }
};
