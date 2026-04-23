import express from "express";
import {
  getAuthorizationUrl,
  handleOAuthCallback,
  disconnectSpotify,
  getSpotifyProfile,
  getCurrentlyPlaying,
  getPlaybackState,
  getDevices,
  getAccessToken,
  play,
  pause,
  next,
  previous,
  seek,
  setVolume,
  setRepeatMode,
  setShuffle,
  getUserPlaylists,
  getLikedSongs,
  getPlaylistTracks,
  searchTracks,
  createPlaylist,
  addTrackToPlaylist,
  getRecentlyPlayed,
  transferPlayback,
  login,
} from "../controllers/spotify.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// OAuth flow
router.get("/login", login);
router.get("/auth/url", getAuthorizationUrl);
router.get("/auth/callback", protectRoute, handleOAuthCallback);
router.post("/disconnect", protectRoute, disconnectSpotify);

// Profile
router.get("/profile", protectRoute, getSpotifyProfile);

// Playback state
router.get("/currently-playing", protectRoute, getCurrentlyPlaying);
router.get("/playback-state", protectRoute, getPlaybackState);
router.get("/devices", protectRoute, getDevices);
router.get("/token", protectRoute, getAccessToken);

// Playback controls
router.post("/play", protectRoute, play);
router.post("/pause", protectRoute, pause);
router.post("/next", protectRoute, next);
router.post("/previous", protectRoute, previous);
router.post("/seek", protectRoute, seek);
router.post("/volume", protectRoute, setVolume);
router.post("/repeat", protectRoute, setRepeatMode);
router.post("/shuffle", protectRoute, setShuffle);
router.post("/transfer-playback", protectRoute, transferPlayback);

// Library & Search
router.get("/playlists", protectRoute, getUserPlaylists);
router.get("/liked-songs", protectRoute, getLikedSongs);
router.get("/playlist/:playlistId/tracks", protectRoute, getPlaylistTracks);
router.get("/search", protectRoute, searchTracks);
router.post("/playlists", protectRoute, createPlaylist);
router.post("/playlists/:playlistId/tracks", protectRoute, addTrackToPlaylist);
router.get("/recently-played", protectRoute, getRecentlyPlayed);

export default router;
