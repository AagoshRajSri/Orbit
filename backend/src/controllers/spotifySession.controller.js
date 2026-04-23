import { spotifySessionService } from "../services/spotifySession.service.js";

/**
 * Create a new listening session
 */
export const createSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { mode = "shared" } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!["shared", "ghost"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }

    const session = await spotifySessionService.createSession(
      userId,
      req.user.username || "Anonymous",
      req.user.avatar || null,
      mode,
    );

    res.json({
      success: true,
      message: "Session created",
      session: {
        sessionId: session.sessionId,
        mode: session.mode,
        participants: session.participants,
      },
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get session details
 */
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await spotifySessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        hostId: session.hostId,
        mode: session.mode,
        participants: session.participants,
        currentTrack: session.currentTrack,
        isPlaying: session.isPlaying,
        positionMs: session.positionMs,
        syncVersion: session.syncVersion,
      },
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Join a session
 */
export const joinSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { sessionId } = req.body;
    const { ghostMode = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    const session = await spotifySessionService.joinSession(
      sessionId,
      userId,
      req.user.username || "Anonymous",
      req.user.avatar || null,
      ghostMode,
    );

    res.json({
      success: true,
      message: "Joined session",
      session: {
        sessionId: session.sessionId,
        mode: session.mode,
        participants: session.participants,
        currentTrack: session.currentTrack,
        isPlaying: session.isPlaying,
        positionMs: session.positionMs,
        syncBuffer: session.syncBuffer.slice(-10), // Last 10 sync points
      },
    });
  } catch (error) {
    console.error("Failed to join session:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Leave a session
 */
export const leaveSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    const result = await spotifySessionService.leaveSession(sessionId, userId);

    res.json({
      success: true,
      message: result ? "Left session" : "Session ended",
      session: result,
    });
  } catch (error) {
    console.error("Failed to leave session:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user's active sessions
 */
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const sessions = await spotifySessionService.getUserSessions(userId);

    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        hostId: s.hostId,
        mode: s.mode,
        participantCount: s.participants.length,
        currentTrack: s.currentTrack,
        isPlaying: s.isPlaying,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to get user sessions:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Transfer host control
 */
export const transferHost = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { sessionId, newHostId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!sessionId || !newHostId) {
      return res
        .status(400)
        .json({ error: "Session ID and new host ID required" });
    }

    const session = await spotifySessionService.transferHost(
      sessionId,
      userId,
      newHostId,
    );

    res.json({
      success: true,
      message: "Host transferred",
      session: {
        hostId: session.hostId,
        hostName: session.hostName,
      },
    });
  } catch (error) {
    console.error("Failed to transfer host:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Toggle ghost mode
 */
export const toggleGhostMode = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { sessionId, ghostMode } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!sessionId || typeof ghostMode !== "boolean") {
      return res
        .status(400)
        .json({ error: "Session ID and ghost mode required" });
    }

    const session = await spotifySessionService.toggleGhostMode(
      sessionId,
      userId,
      ghostMode,
    );

    res.json({
      success: true,
      message: ghostMode ? "Ghost mode enabled" : "Ghost mode disabled",
      session: {
        sessionId: session.sessionId,
        mode: session.mode,
      },
    });
  } catch (error) {
    console.error("Failed to toggle ghost mode:", error);
    res.status(500).json({ error: error.message });
  }
};
