import { useAuthStore } from "../store/useAuthStore";

const CHANNEL_NAME = "orbit_presence_sync";
let channel;
let isLeader = false;
let heartbeatInterval;

let lastHeartbeat = Date.now();

/**
 * Initializes cross-tab presence synchronization and leader election.
 * Ensures only the active tab dictates "idle" vs "active" presence updates,
 * preventing stale background tabs from overriding active sessions.
 */
export const initTabSync = () => {
  if (typeof window === "undefined" || !window.BroadcastChannel) return;
  
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }

  // Attempt to claim leadership upon initialization
  claimLeadership();

  // Follower Watchdog: If the leader tab crashes or is heavily throttled by the browser 
  // (e.g., Chrome background tab throttling), we must unilaterally take over.
  setInterval(() => {
    if (!isLeader && Date.now() - lastHeartbeat > 6000) {
      console.warn("[TabSync] Leader heartbeat timed out. Promoting current tab to Leader.");
      claimLeadership();
    }
  }, 3000);

  channel.onmessage = (event) => {
    const { type, payload } = event.data;

    if (type === "LEADER_HEARTBEAT") {
      // Another tab is asserting leadership
      isLeader = false;
      lastHeartbeat = Date.now();
    }

    if (type === "PRESENCE_SYNC_UPDATE") {
      // Sync local Zustand store with the leader's presence state
      const state = useAuthStore.getState();
      const myId = state.authUser?._id?.toString() || state.authUser?.id?.toString();
      if (myId) {
        state.updateUserPresence(myId, payload);
      }
    }
  };

  // When tab becomes visible, it attempts to claim leadership
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      claimLeadership();
      
      // Resync our presence actively now that we are the leader
      const state = useAuthStore.getState();
      const myId = state.authUser?._id?.toString() || state.authUser?.id?.toString();
      if (myId && state.presenceMap[myId]) {
        broadcastPresenceToTabs(state.presenceMap[myId]);
      }
    } else {
      // Step down when hidden so another active tab can take over
      isLeader = false;
    }
  });
};

const claimLeadership = () => {
  isLeader = true;
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Assert leadership every 2 seconds
  heartbeatInterval = setInterval(() => {
    if (isLeader && channel) {
      channel.postMessage({ type: "LEADER_HEARTBEAT" });
    }
  }, 2000);
};

/**
 * Broadcasts a presence change to all other background tabs.
 * Called automatically by useAuthStore.
 */
export const broadcastPresenceToTabs = (presence) => {
  if (channel && isLeader) {
    channel.postMessage({ type: "PRESENCE_SYNC_UPDATE", payload: presence });
  }
};
