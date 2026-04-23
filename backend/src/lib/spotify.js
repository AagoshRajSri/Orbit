import axios from "axios";
import { SpotifyCredential } from "../models/spotifyCredential.model.js";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com";

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state) {
    const scopes = [
      "user-read-private",
      "user-read-email",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "user-read-playback-state",
      "streaming",
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: scopes.join(" "),
      state,
    });

    return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(
        `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
      };
    } catch (error) {
      console.error("Spotify token exchange failed:", error);
      throw new Error("Failed to exchange Spotify code for token");
    }
  }

  /**
   * Refresh an access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(
        `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error("Spotify token refresh failed:", error);
      throw new Error("Failed to refresh Spotify token");
    }
  }

  /**
   * Ensure access token is valid, refreshing if necessary
   */
  async ensureValidToken(userId) {
    const credential = await SpotifyCredential.findOne({ userId });
    if (!credential) {
      throw new Error("Spotify credentials not found");
    }

    if (!credential.refreshToken) {
      throw new Error("Spotify refresh token missing - please reconnect");
    }

    // If token expires within 5 minutes, refresh it
    if (credential.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
      console.log(`Refreshing Spotify token for user ${userId}`);
      try {
        const { accessToken, expiresIn } = await this.refreshAccessToken(
          credential.refreshToken,
        );

        credential.accessToken = accessToken;
        credential.expiresAt = new Date(Date.now() + expiresIn * 1000);
        await credential.save();
      } catch (refreshError) {
        console.error(`Token refresh failed for user ${userId}:`, refreshError.message);
        if (refreshError.message.includes("invalid_grant")) {
          await SpotifyCredential.deleteOne({ userId });
          throw new Error("Spotify session expired - please reconnect");
        }
        throw refreshError;
      }
    }

    return credential.accessToken;
  }

  /**
   * Get user profile using an access token directly (for OAuth callback)
   */
  async getUserProfileWithToken(accessToken) {
    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get Spotify user profile:", error);
      throw new Error("Failed to fetch Spotify user profile");
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to get Spotify user profile:", error);
      throw new Error("Failed to fetch Spotify user profile");
    }
  }

  /**
   * Get currently playing track
   */
  async getCurrentlyPlaying(userId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/me/player/currently-playing`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      // 204 No Content means nothing is playing
      if (response.status === 204) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Failed to get currently playing track:", error);
      return null;
    }
  }

  /**
   * Set volume
   */
  async setVolume(userId, deviceId, volumePercent) {
    const accessToken = await this.ensureValidToken(userId);
    if (volumePercent < 0 || volumePercent > 100) throw new Error("Volume must be between 0 and 100");
    
    try {
      await axios.put(
        `${SPOTIFY_API_BASE}/me/player/volume`,
        {},
        {
          params: { 
            volume_percent: Math.round(volumePercent),
            device_id: deviceId 
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to set volume:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to set volume");
    }
  }

  /**
   * Get playback state
   */
  async getPlaybackState(userId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/player`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 204) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Failed to get playback state:", error);
      throw new Error("Failed to fetch playback state");
    }
  }

  /**
   * Get available devices
   */
  async getDevices(userId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/me/player/devices`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data.devices || [];
    } catch (error) {
      console.error("Failed to get devices:", error);
      throw new Error("Failed to fetch devices");
    }
  }

  /**
   * Start or resume playback
   */
  async play(userId, deviceId, context) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const payload = {};

      if (context?.uri) {
        payload.context_uri = context.uri;
      } else if (context?.uris) {
        payload.uris = context.uris;
      }

      if (context?.positionMs !== undefined) {
        payload.position_ms = context.positionMs;
      }

      console.log(`Sending play request to Spotify for user ${userId} on device ${deviceId}:`, payload);

      await axios.put(
        `${SPOTIFY_API_BASE}/me/player/play`,
        payload,
        {
          params: { device_id: deviceId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to start playback:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to start playback");
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(userId, name, description = "Created via Orbit Spotify Sync") {
    const accessToken = await this.ensureValidToken(userId);
    const credential = await SpotifyCredential.findOne({ userId });
    
    if (!credential || !credential.spotifyId) {
      throw new Error("Spotify ID not found for user");
    }

    try {
      const response = await axios.post(
        `${SPOTIFY_API_BASE}/users/${credential.spotifyId}/playlists`,
        {
          name,
          description,
          public: false, // Default to private
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to create playlist:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to create playlist");
    }
  }

  /**
   * Pause playback
   */
  async pause(userId, deviceId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.put(
        `${SPOTIFY_API_BASE}/me/player/pause`,
        {},
        {
          params: { device_id: deviceId },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to pause playback:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to pause playback");
    }
  }

  /**
   * Skip to next track
   */
  async nextTrack(userId, deviceId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.post(
        `${SPOTIFY_API_BASE}/me/player/next`,
        {},
        {
          params: { device_id: deviceId },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to skip to next track:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to skip to next track");
    }
  }

  /**
   * Skip to previous track
   */
  async previousTrack(userId, deviceId) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.post(
        `${SPOTIFY_API_BASE}/me/player/previous`,
        {},
        {
          params: { device_id: deviceId },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to skip to previous track:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to skip to previous track");
    }
  }

  /**
   * Seek to position
   */
  async seek(userId, deviceId, positionMs) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.put(
        `${SPOTIFY_API_BASE}/me/player/seek`,
        {},
        {
          params: {
            position_ms: Math.round(positionMs),
            device_id: deviceId,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to seek:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to seek to position");
    }
  }

  /**
   * Transfer playback to another device
   */
  async transferPlayback(userId, deviceId, play = true) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.put(
        `${SPOTIFY_API_BASE}/me/player`,
        {
          device_ids: [deviceId],
          play,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to transfer playback:", error);
      throw new Error("Failed to transfer playback");
    }
  }

  /**
   * Set repeat mode
   */
  async setRepeatMode(userId, deviceId, state) {
    // state: off, track, context
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.put(
        `${SPOTIFY_API_BASE}/me/player/repeat`,
        { state, device_id: deviceId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to set repeat mode:", error);
      throw new Error("Failed to set repeat mode");
    }
  }

  /**
   * Set shuffle mode
   */
  async setShuffle(userId, deviceId, state) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      await axios.put(
        `${SPOTIFY_API_BASE}/me/player/shuffle`,
        { state, device_id: deviceId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to set shuffle mode:", error);
      throw new Error("Failed to set shuffle mode");
    }
  }

  /**
   * Get user's top tracks
   */
  async getTopTracks(userId, limit = 20, timeRange = "medium_term") {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/top/tracks`, {
        params: {
          limit,
          time_range: timeRange,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to get top tracks:", error);
      throw new Error("Failed to fetch top tracks");
    }
  }

  /**
   * Get user's playlists
   */
  async getPlaylists(userId, limit = 50) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/playlists`, {
        params: { limit },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.items || [];
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message || "Unknown error during fetch";
      console.error(`Failed to get playlists for user ${userId}:`, error.response?.data || error.message);
      throw new Error(`Spotify Fetch Error: ${errorMsg}`);
    }
  }

  /**
   * Get playlist tracks
   */
  async getPlaylistTracks(userId, playlistId, limit = 50) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
          params: { limit },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data.items || [];
    } catch (error) {
      console.error(`Failed to get tracks for playlist ${playlistId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to fetch playlist tracks");
    }
  }

  /**
   * Search for tracks
   */
  async search(userId, query, type = "track", limit = 10) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      console.log(`[Spotify Search] userId=${userId}, query=${query}, type=${type}, limit=${limit}`);
      const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
        params: {
          q: query,
          type,
          limit,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to search Spotify for "${query}":`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to search Spotify");
    }
  }

  /**
   * Add tracks to a playlist
   */
  async addTracksToPlaylist(userId, playlistId, uris) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.post(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        { uris },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to add tracks to playlist ${playlistId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to add tracks to playlist");
    }
  }

  /**
   * Get recently played tracks
   */
  async getRecentlyPlayed(userId, limit = 20) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/player/recently-played`, {
        params: { limit },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data;
    } catch (error) {
      // If 403 Forbidden, user lacks the history scope. Return empty gracefully so the app doesn't break
      if (error.response?.status === 403) {
        console.warn(`User ${userId} lacks user-read-recently-played scope.`);
        return { items: [] }; 
      }
      console.error("Failed to get recently played:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to fetch recently played tracks");
    }
  }
  /**
   * Get user's liked songs (saved tracks)
   */
  async getLikedSongs(userId, limit = 50) {
    const accessToken = await this.ensureValidToken(userId);

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/me/tracks`, {
        params: { limit },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.items || [];
    } catch (error) {
      console.error(`Failed to get liked songs for user ${userId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to fetch liked songs");
    }
  }
}

export const spotifyService = new SpotifyService();
