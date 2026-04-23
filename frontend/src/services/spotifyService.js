/**
 * Spotify Service - Frontend API wrapper for Spotify backend endpoints
 */

import axiosInstance from "../lib/axios.jsx";

class SpotifyService {
  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthorizationUrl() {
    try {
      const response = await axiosInstance.get("/spotify/auth/url");
      return response.data.authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      throw error;
    }
  }

  /**
   * Start OAuth login flow - opens Spotify auth in new window
   */
  async initiateLogin() {
    try {
      const authUrl = await this.getAuthorizationUrl();
      // Redirect in the same window to ensure the state isn't isolated from the main app
      // and so self-signed SSL warnings can be safely bypassed.
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate Spotify login:", error);
      throw error;
    }
  }

  /**
   * Get current Spotify profile
   */
  async getProfile() {
    try {
      const response = await axiosInstance.get("/spotify/profile");
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { linked: false };
      }
      console.error("Failed to get profile:", error);
      throw error;
    }
  }

  /**
   * Disconnect Spotify account
   */
  async disconnect() {
    try {
      const response = await axiosInstance.post("/spotify/disconnect");
      return response.data;
    } catch (error) {
      console.error("Failed to disconnect:", error);
      throw error;
    }
  }

  /**
   * Get access token for Web Playback SDK
   */
  async getAccessToken() {
    try {
      const response = await axiosInstance.get("/spotify/token");
      return response.data;
    } catch (error) {
      console.error("Failed to get access token:", error);
      throw error;
    }
  }

  /**
   * Get currently playing track
   */
  async getCurrentlyPlaying() {
    try {
      const response = await axiosInstance.get("/spotify/currently-playing");
      return response.data.currentTrack;
    } catch (error) {
      console.error("Failed to get currently playing:", error);
      return null;
    }
  }

  /**
   * Get playback state
   */
  async getPlaybackState() {
    try {
      const response = await axiosInstance.get("/spotify/playback-state");
      return response.data.state;
    } catch (error) {
      console.error("Failed to get playback state:", error);
      return null;
    }
  }

  /**
   * Get available devices
   */
  async getDevices() {
    try {
      const response = await axiosInstance.get("/spotify/devices");
      return response.data.devices || [];
    } catch (error) {
      console.error("Failed to get devices:", error);
      throw error;
    }
  }

  /**
   * Play track
   */
  async play(deviceId, context) {
    try {
      const response = await axiosInstance.post("/spotify/play", {
        deviceId,
        context,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to play:", error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(deviceId) {
    try {
      const response = await axiosInstance.post("/spotify/pause", { deviceId });
      return response.data;
    } catch (error) {
      console.error("Failed to pause:", error);
      throw error;
    }
  }

  /**
   * Skip to next
   */
  async next(deviceId) {
    try {
      const response = await axiosInstance.post("/spotify/next", { deviceId });
      return response.data;
    } catch (error) {
      console.error("Failed to skip:", error);
      throw error;
    }
  }

  /**
   * Skip to previous
   */
  async previous(deviceId) {
    try {
      const response = await axiosInstance.post("/spotify/previous", { deviceId });
      return response.data;
    } catch (error) {
      console.error("Failed to skip:", error);
      throw error;
    }
  }

  /**
   * Set volume
   */
  async setVolume(deviceId, volumePercent) {
    try {
      const response = await axiosInstance.post("/spotify/volume", {
        deviceId,
        volumePercent,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to set volume:", error);
      throw error;
    }
  }

  /**
   * Set repeat mode
   */
  async setRepeat(deviceId, state) {
    try {
      const response = await axiosInstance.post("/spotify/repeat", {
        deviceId,
        state,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to set repeat mode:", error);
      throw error;
    }
  }

  /**
   * Set shuffle mode
   */
  async setShuffle(deviceId, state) {
    try {
      const response = await axiosInstance.post("/spotify/shuffle", {
        deviceId,
        state,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to set shuffle mode:", error);
      throw error;
    }
  }

  /**
   * Seek to position
   */
  async seek(deviceId, positionMs) {
    try {
      const response = await axiosInstance.post("/spotify/seek", {
        deviceId,
        positionMs,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to seek:", error);
      throw error;
    }
  }

  /**
   * Transfer playback to another device
   */
  async transferPlayback(deviceId, play = true) {
    try {
      const response = await axiosInstance.post("/spotify/transfer-playback", {
        deviceId,
        play,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to transfer playback:", error);
      throw error;
    }
  }

  /**
   * Create listening session
   */
  async createSession(mode = "shared") {
    try {
      const response = await axiosInstance.post("/spotify/session/create", { mode });
      return response.data.session;
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }
  }

  /**
   * Get session
   */
  async getSession(sessionId) {
    try {
      const response = await axiosInstance.get(`/spotify/session/${sessionId}`);
      return response.data.session;
    } catch (error) {
      console.error("Failed to get session:", error);
      throw error;
    }
  }

  /**
   * Join session
   */
  async joinSession(sessionId, ghostMode = false) {
    try {
      const response = await axiosInstance.post("/spotify/session/join", {
        sessionId,
        ghostMode,
      });
      return response.data.session;
    } catch (error) {
      console.error("Failed to join session:", error);
      throw error;
    }
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId) {
    try {
      const response = await axiosInstance.post("/spotify/session/leave", { sessionId });
      return response.data;
    } catch (error) {
      console.error("Failed to leave session:", error);
      throw error;
    }
  }

  /**
   * Transfer host control
   */
  async transferHost(sessionId, newHostId) {
    try {
      const response = await axiosInstance.post("/spotify/session/transfer-host", {
        sessionId,
        newHostId,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to transfer host:", error);
      throw error;
    }
  }

  /**
   * Toggle ghost mode
   */
  async toggleGhostMode(sessionId, ghostMode) {
    try {
      const response = await axiosInstance.post("/spotify/session/toggle-ghost", {
        sessionId,
        ghostMode,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to toggle ghost:", error);
      throw error;
    }
  }

  /**
   * Get user playlists
   */
  async getPlaylists() {
    try {
      const response = await axiosInstance.get("/spotify/playlists");
      return response.data.playlists || [];
    } catch (error) {
      console.error("Failed to get playlists:", error);
      throw error;
    }
  }

  /**
   * Get user liked songs
   */
  async getLikedSongs() {
    try {
      const response = await axiosInstance.get("/spotify/liked-songs");
      return response.data.songs || [];
    } catch (error) {
      console.error("Failed to get liked songs:", error);
      throw error;
    }
  }

  /**
   * Get playlist tracks
   */
  async getPlaylistTracks(playlistId) {
    try {
      const response = await axiosInstance.get(`/spotify/playlist/${playlistId}/tracks`);
      return response.data.tracks || [];
    } catch (error) {
      console.error("Failed to get playlist tracks:", error);
      throw error;
    }
  }

  /**
   * Search tracks
   */
  async searchTracks(query) {
    try {
      const response = await axiosInstance.get(
        `/spotify/search?q=${encodeURIComponent(query)}&limit=10`,
      );
      return response.data.results?.tracks?.items || [];
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }

  /**
   * Add a track to a playlist
   */
  async addTrackToPlaylist(playlistId, trackUri) {
    try {
      const response = await axiosInstance.post(`/spotify/playlists/${playlistId}/tracks`, {
        uris: [trackUri],
      });
      return response.data;
    } catch (error) {
      console.error("Failed to add track to playlist:", error);
      throw error;
    }
  }

  /**
   * Get recently played tracks
   */
  async getRecentlyPlayed() {
    try {
      const response = await axiosInstance.get("/spotify/recently-played");
      return response.data.tracks || [];
    } catch (error) {
      console.error("Failed to get recently played:", error);
      throw error;
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(name, description) {
    try {
      const response = await axiosInstance.post("/spotify/playlists", {
        name,
        description,
      });
      return response.data.playlist;
    } catch (error) {
      console.error("Failed to create playlist:", error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback (called when user is redirected after auth)
   */
  async handleAuthCode(code) {
    try {
      const response = await axiosInstance.get(`/spotify/auth/callback?code=${code}`);
      return response.data;
    } catch (error) {
      console.error("Failed to handle auth code:", error);
      throw error;
    }
  }
}

export const spotifyService = new SpotifyService();
