import React, { useState } from "react";
import { useSpotifyStore } from "../../store/useSpotifyStore";
import { spotifyService } from "../../services/spotifyService";
import {
  Users,
  Plus,
  Share2,
  Copy,
  Check,
  LogOut,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";

/**
 * Spotify Session Manager
 * Handles creating, joining, and managing shared listening sessions
 */
export default function SpotifySessionManager() {
  const {
    sessionId,
    isHost,
    participants,
    mode,
    isGhostMode,
    createSession,
    joinSession,
    leaveSession,
    transferHost,
    toggleGhostMode,
  } = useSpotifyStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSession = async (sessionMode) => {
    try {
      setIsLoading(true);
      await createSession(sessionMode);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;
    try {
      setIsLoading(true);
      await joinSession(joinCode, false);
      setShowJoinModal(false);
      setJoinCode("");
    } catch (error) {
      console.error("Failed to join session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    if (window.confirm("Leave this listening session?")) {
      await leaveSession();
    }
  };

  const handleCopySessionCode = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // In Session View
  if (sessionId) {
    return (
      <div className="fixed bottom-32 right-4 w-80 bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 p-4 z-40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Session Active
          </h3>
          <span
            className={`badge ${
              mode === "ghost" ? "badge-secondary" : "badge-primary"
            }`}
          >
            {mode === "ghost" ? "👀 Ghost" : "🎵 Shared"}
          </span>
        </div>

        {/* Participants */}
        <div className="mb-4 p-3 bg-base-200 rounded-xl max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-base-content/60 mb-2 uppercase">
            Participants ({participants.length})
          </p>
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.userId}
                className="flex items-center justify-between p-2 bg-base-100 rounded"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {p.avatar && (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm truncate flex items-center gap-1">
                    {p.name}
                    {isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                    {p.isGhost && (
                      <Eye className="w-3 h-3 text-base-content/40" />
                    )}
                  </span>
                </div>
                {isHost && !p.isHost && (
                  <button
                    onClick={() => transferHost(p.userId)}
                    className="btn btn-xs btn-ghost"
                    title="Transfer host"
                  >
                    👑
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Session Code */}
        <div className="mb-4 p-3 bg-base-200 rounded-xl">
          <p className="text-xs font-semibold text-base-content/60 mb-1 uppercase">
            Session Code
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-base-300 flex-1 px-2 py-1 rounded">
              {sessionId?.slice(0, 12)}...
            </code>
            <button
              onClick={handleCopySessionCode}
              className={`btn btn-sm btn-ghost ${copied ? "btn-success" : ""}`}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Ghost Mode Toggle */}
        <button
          onClick={() => toggleGhostMode(!isGhostMode)}
          className={`w-full btn btn-sm mb-2 ${
            isGhostMode ? "btn-secondary" : "btn-outline"
          }`}
        >
          {isGhostMode ? (
            <>
              <EyeOff className="w-4 h-4" /> Ghost Mode ON
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Enable Ghost Mode
            </>
          )}
        </button>

        {/* Leave Session */}
        <button
          onClick={handleLeaveSession}
          className="w-full btn btn-sm btn-error btn-outline"
        >
          <LogOut className="w-4 h-4" /> Leave Session
        </button>
      </div>
    );
  }

  // No Session View - Show Buttons
  return (
    <>
      {/* Session Action Buttons */}
      <div className="fixed bottom-32 right-4 flex flex-col gap-2 z-40">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" /> Start Listening
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="btn btn-secondary gap-2 shadow-lg"
        >
          <Share2 className="w-5 h-5" /> Join Session
        </button>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-900/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              Start Listening Together
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => handleCreateSession("shared")}
                disabled={isLoading}
                className="w-full btn btn-lg btn-primary"
              >
                {isLoading ? (
                  <span className="loading loading-spinner" />
                ) : (
                  <>
                    <Users className="w-5 h-5" /> Shared Mode
                  </>
                )}
              </button>
              <p className="text-sm text-base-content/70">
                Everyone can see you're listening. Ideal for group sessions 🎵
              </p>

              <div className="divider">OR</div>

              <button
                onClick={() => handleCreateSession("ghost")}
                disabled={isLoading}
                className="w-full btn btn-lg btn-secondary"
              >
                {isLoading ? (
                  <span className="loading loading-spinner" />
                ) : (
                  <>
                    <Eye className="w-5 h-5" /> Ghost Mode
                  </>
                )}
              </button>
              <p className="text-sm text-base-content/70">
                Listen together without showing presence. Stay anonymous 👀
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              disabled={isLoading}
              className="w-full btn btn-ghost mt-6"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-900/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Join Listening Session</h2>

            <input
              type="text"
              placeholder="Enter session code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="input input-bordered w-full mb-4"
            />

            <button
              onClick={handleJoinSession}
              disabled={isLoading || !joinCode.trim()}
              className="w-full btn btn-primary mb-2"
            >
              {isLoading ? (
                <span className="loading loading-spinner" />
              ) : (
                "Join"
              )}
            </button>

            <button
              onClick={() => setShowJoinModal(false)}
              disabled={isLoading}
              className="w-full btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
