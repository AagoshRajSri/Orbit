import { SpotifySession } from "../models/spotifySession.model.js";
import { nanoid } from "nanoid";
import { spotifyService } from "../lib/spotify.js";

class SpotifySessionService {
  /**
   * Create a new session
   */
  async createSession(hostId, hostName, hostAvatar, mode = "shared") {
    const sessionId = `session_${nanoid(12)}`;

    const session = new SpotifySession({
      sessionId,
      hostId,
      hostName,
      hostAvatar,
      mode,
      participants: [
        {
          userId: hostId,
          name: hostName,
          avatar: hostAvatar,
          isGhost: mode === "ghost",
        },
      ],
    });

    await session.save();
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    return SpotifySession.findOne({ sessionId }).populate(
      "hostId participants.userId",
      "username email displayName",
    );
  }

  /**
   * Join a session
   */
  async joinSession(sessionId, userId, userName, userAvatar, isGhost = false) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    // Check if already a participant
    const existingParticipant = session.participants.find(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (existingParticipant) {
      existingParticipant.isActive = true;
      existingParticipant.lastHeartbeat = new Date();
    } else {
      session.participants.push({
        userId,
        name: userName,
        avatar: userAvatar,
        isGhost,
        lastHeartbeat: new Date(),
      });
    }

    await session.save();
    return session;
  }

  /**
   * Leave a session
   */
  async leaveSession(sessionId, userId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    // Remove participant or mark as inactive
    session.participants = session.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );

    // If host leaves and there are still participants, transfer host
    if (session.hostId.toString() === userId.toString()) {
      if (session.participants.length > 0) {
        session.hostId = session.participants[0].userId;
        session.hostName = session.participants[0].name;
        session.hostAvatar = session.participants[0].avatar;
      } else {
        // No participants left, delete session
        await SpotifySession.deleteOne({ sessionId });
        return null;
      }
    }

    await session.save();
    return session;
  }

  /**
   * Update playback state
   */
  async updatePlaybackState(sessionId, playbackData) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    const { isPlaying, positionMs, currentTrack, hostDevice } = playbackData;

    Object.assign(session, {
      isPlaying: isPlaying ?? session.isPlaying,
      positionMs: positionMs ?? session.positionMs,
      currentTrack: currentTrack ?? session.currentTrack,
      hostDevice: hostDevice ?? session.hostDevice,
      lastSyncAt: new Date(),
      syncVersion: (session.syncVersion || 0) + 1,
    });

    // Add to sync buffer for late joiners
    if (playbackData.action) {
      session.syncBuffer.push({
        action: playbackData.action,
        track: currentTrack?.id,
        positionMs,
        timestamp: new Date(),
      });

      // Keep only last 50 actions
      if (session.syncBuffer.length > 50) {
        session.syncBuffer = session.syncBuffer.slice(-50);
      }
    }

    await session.save();
    return session;
  }

  /**
   * Transfer host control
   */
  async transferHost(sessionId, currentHostId, newHostId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    // Verify current host
    if (session.hostId.toString() !== currentHostId.toString()) {
      throw new Error("Only current host can transfer control");
    }

    // Find new host in participants
    const newHostParticipant = session.participants.find(
      (p) => p.userId.toString() === newHostId.toString(),
    );

    if (!newHostParticipant) {
      throw new Error("New host not found in session");
    }

    session.hostId = newHostId;
    session.hostName = newHostParticipant.name;
    session.hostAvatar = newHostParticipant.avatar;

    await session.save();
    return session;
  }

  /**
   * Toggle ghost mode
   */
  async toggleGhostMode(sessionId, userId, ghostStatus) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    const participant = session.participants.find(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (!participant) {
      throw new Error("User not in session");
    }

    participant.isGhost = ghostStatus;
    await session.save();
    return session;
  }

  /**
   * Sync heartbeat (keep-alive)
   */
  async syncHeartbeat(sessionId, userId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    const participant = session.participants.find(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (participant) {
      participant.lastHeartbeat = new Date();
      participant.isActive = true;
      await session.save();
    }

    return session;
  }

  /**
   * Get active sessions by user
   */
  async getUserSessions(userId) {
    return SpotifySession.find({
      $or: [{ hostId: userId }, { "participants.userId": userId }],
      expiresAt: { $gt: new Date() },
    })
      .populate("hostId participants.userId", "username email displayName")
      .sort({ createdAt: -1 });
  }

  /**
   * Clean up inactive participants (after 5 minutes no heartbeat)
   */
  async cleanupInactiveParticipants(sessionId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Mark as inactive
    session.participants = session.participants.map((p) => ({
      ...p,
      isActive:
        p.lastHeartbeat && p.lastHeartbeat > fiveMinutesAgo ? true : false,
    }));

    // Remove completely inactive participants
    session.participants = session.participants.filter((p) => p.isActive);

    // If host is removed, transfer control
    if (
      session.hostId &&
      !session.participants.find((p) => p.userId.equals(session.hostId))
    ) {
      if (session.participants.length > 0) {
        session.hostId = session.participants[0].userId;
        session.hostName = session.participants[0].name;
        session.hostAvatar = session.participants[0].avatar;
      } else {
        // Delete empty session
        await SpotifySession.deleteOne({ sessionId });
        return null;
      }
    }

    await session.save();
    return session;
  }

  /**
   * End session (delete)
   */
  async endSession(sessionId) {
    return SpotifySession.deleteOne({ sessionId });
  }
}

export const spotifySessionService = new SpotifySessionService();
