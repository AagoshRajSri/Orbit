import { spotifySessionService } from "../services/spotifySession.service.js";

/**
 * Spotify WebSocket Events Handler
 * Manages real-time synchronization for shared listening sessions
 */

export const spotifyEvents = {
  /**
   * User joins a session
   */
  "spotify:join-session": async (socket, io, { sessionId, userId }) => {
    try {
      const session = await spotifySessionService.getSession(sessionId);

      if (!session) {
        socket.emit("spotify:error", { message: "Session not found" });
        return;
      }

      socket.join(`spotify-session:${sessionId}`);
      socket.data.userId = userId;
      socket.data.spotifySession = sessionId;

      // Notify all participants
      io.to(`spotify-session:${sessionId}`).emit("spotify:participant-joined", {
        sessionId,
        participants: session.participants,
        participantCount: session.participants.length,
      });

      // Send current state to joining user
      socket.emit("spotify:session-state", {
        sessionId,
        hostId: session.hostId,
        mode: session.mode,
        currentTrack: session.currentTrack,
        isPlaying: session.isPlaying,
        positionMs: session.positionMs,
        syncVersion: session.syncVersion,
        participants: session.participants,
      });

      console.log(`User ${userId} joined Spotify session ${sessionId}`);
    } catch (error) {
      console.error("Spotify join-session error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * User leaves a session
   */
  "spotify:leave-session": async (socket, io, { sessionId, userId }) => {
    try {
      const session = await spotifySessionService.leaveSession(
        sessionId,
        userId,
      );

      socket.leave(`spotify-session:${sessionId}`);
      socket.data.spotifySession = null;

      if (session) {
        // Notify remaining participants about departure and host change if needed
        io.to(`spotify-session:${sessionId}`).emit("spotify:participant-left", {
          sessionId,
          userId,
          newHostId: session.hostId,
          participants: session.participants,
          participantCount: session.participants.length,
        });
      } else {
        // Session ended
        io.to(`spotify-session:${sessionId}`).emit("spotify:session-ended", {
          sessionId,
          reason: "host-disconnected",
        });
      }

      console.log(`User ${userId} left Spotify session ${sessionId}`);
    } catch (error) {
      console.error("Spotify leave-session error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * Host publishes playback action (play, pause, skip, seek)
   */
  "spotify:playback-action": async (
    socket,
    io,
    { sessionId, userId, action, data },
  ) => {
    try {
      const session = await spotifySessionService.getSession(sessionId);

      if (!session) {
        socket.emit("spotify:error", { message: "Session not found" });
        return;
      }

      // Verify user is host
      if (session.hostId.toString() !== userId.toString()) {
        socket.emit("spotify:error", {
          message: "Only host can control playback",
        });
        return;
      }

      // Update session state with action
      const updatedSession = await spotifySessionService.updatePlaybackState(
        sessionId,
        {
          action,
          isPlaying: data.isPlaying,
          positionMs: data.positionMs,
          currentTrack: data.currentTrack,
          hostDevice: data.hostDevice,
        },
      );

      // Broadcast action to all participants
      io.to(`spotify-session:${sessionId}`).emit("spotify:playback-synced", {
        sessionId,
        action,
        isPlaying: updatedSession.isPlaying,
        positionMs: updatedSession.positionMs,
        currentTrack: updatedSession.currentTrack,
        syncVersion: updatedSession.syncVersion,
        timestamp: updatedSession.lastSyncAt,
      });

      console.log(
        `Playback action [${action}] from host ${userId} in session ${sessionId}`,
      );
    } catch (error) {
      console.error("Spotify playback-action error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * Periodic state synchronization (reconciliation)
   */
  "spotify:sync-state": async (socket, io, { sessionId, userId, state }) => {
    try {
      const session = await spotifySessionService.getSession(sessionId);

      if (!session) {
        socket.emit("spotify:error", { message: "Session not found" });
        return;
      }

      // Verify user is host
      if (session.hostId.toString() !== userId.toString()) {
        // Non-host sends state → store heartbeat only
        await spotifySessionService.syncHeartbeat(sessionId, userId);
        return;
      }

      // Host publishes full state
      const updatedSession = await spotifySessionService.updatePlaybackState(
        sessionId,
        {
          isPlaying: state.isPlaying,
          positionMs: state.positionMs,
          currentTrack: state.currentTrack,
          hostDevice: state.hostDevice,
        },
      );

      // Broadcast to all participants for reconciliation
      io.to(`spotify-session:${sessionId}`).emit("spotify:state-reconcile", {
        sessionId,
        isPlaying: updatedSession.isPlaying,
        positionMs: updatedSession.positionMs,
        currentTrack: updatedSession.currentTrack,
        syncVersion: updatedSession.syncVersion,
        timestamp: new Date(),
      });

      console.log(
        `State reconciliation in session ${sessionId} - ${updatedSession.participants.length} participants`,
      );
    } catch (error) {
      console.error("Spotify sync-state error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * Transfer host control
   */
  "spotify:transfer-host": async (
    socket,
    io,
    { sessionId, currentHostId, newHostId },
  ) => {
    try {
      const session = await spotifySessionService.transferHost(
        sessionId,
        currentHostId,
        newHostId,
      );

      // Notify all participants of host change
      io.to(`spotify-session:${sessionId}`).emit("spotify:host-transferred", {
        sessionId,
        newHostId: session.hostId,
        newHostName: session.hostName,
        newHostAvatar: session.hostAvatar,
      });

      console.log(
        `Host transferred in session ${sessionId}: ${currentHostId} → ${newHostId}`,
      );
    } catch (error) {
      console.error("Spotify transfer-host error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * Toggle ghost mode (presence visibility)
   */
  "spotify:toggle-ghost": async (
    socket,
    io,
    { sessionId, userId, ghostMode },
  ) => {
    try {
      // Also ensure socket.data has the latest info
      socket.data.userId = userId;
      socket.data.spotifySession = sessionId;

      const session = await spotifySessionService.toggleGhostMode(
        sessionId,
        userId,
        ghostMode,
      );

      const participant = session.participants.find(
        (p) => p.userId.toString() === userId.toString(),
      );

      // Notify all participants
      io.to(`spotify-session:${sessionId}`).emit("spotify:ghost-toggled", {
        sessionId,
        userId,
        ghostMode,
        userName: participant?.name || "Anonymous",
      });

      console.log(
        `Ghost mode ${ghostMode ? "enabled" : "disabled"} for ${userId} in session ${sessionId}`,
      );
    } catch (error) {
      console.error("Spotify toggle-ghost error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * Heartbeat (keep-alive ping)
   */
  "spotify:heartbeat": async (socket, io, { sessionId, userId }) => {
    try {
      await spotifySessionService.syncHeartbeat(sessionId, userId);
      socket.emit("spotify:heartbeat-ack", { success: true });
    } catch (error) {
      console.error("Spotify heartbeat error:", error);
      socket.emit("spotify:error", { message: error.message });
    }
  },

  /**
   * Cleanup (user disconnects)
   */
  "spotify:cleanup": async (socket, io, { sessionId, userId }) => {
    try {
      const session = await spotifySessionService.getSession(sessionId);

      if (session) {
        // Clean up inactive participants
        const updatedSession =
          await spotifySessionService.cleanupInactiveParticipants(sessionId);

        if (updatedSession) {
          io.to(`spotify-session:${sessionId}`).emit(
            "spotify:participant-cleanup",
            {
              sessionId,
              participants: updatedSession.participants,
              participantCount: updatedSession.participants.length,
            },
          );
        } else {
          io.to(`spotify-session:${sessionId}`).emit("spotify:session-ended", {
            sessionId,
            reason: "all-disconnected",
          });
        }
      }

      console.log(`Cleanup for session ${sessionId} completed`);
    } catch (error) {
      console.error("Spotify cleanup error:", error);
    }
  },
};

/**
 * Register all Spotify WebSocket event handlers
 */
export const registerSpotifyEvents = (io) => {
  io.on("connection", (socket) => {
    // Register individual handlers
    for (const [eventName, handler] of Object.entries(spotifyEvents)) {
      socket.on(eventName, async (data) => {
        await handler(socket, io, data);
      });
    }

    // Handle sudden disconnects
    socket.on("disconnect", async () => {
      const sessionId = socket.data.spotifySession;
      if (sessionId) {
        console.log(`Socket disconnected from session ${sessionId}`);
        
        // This is tricky because we don't have the userId here 
        // unless we store it in socket.data
        const userId = socket.data.userId;
        if (userId) {
          try {
            await spotifyEvents["spotify:leave-session"](socket, io, { sessionId, userId });
          } catch (error) {
            console.error("Cleanup on disconnect failed:", error);
          }
        }
      }
    });
  });
};
