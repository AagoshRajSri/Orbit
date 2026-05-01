import { create } from "zustand";
import toast from "../lib/toast";
import { axiosInstance } from "../lib/axios.jsx";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "./useAuthStore";

export const useNexusStore = create((set, get) => ({
  nexuses: [],
  selectedNexus: null,
  selectedNexusId: null, // Tracked for component synchronization
  isNexusesLoading: false,
  isMessagesLoading: false,
  isLoadingMoreParams: false,
  hasMoreNexusMessages: true,
  nexusMessages: [],
  nexusActionView: null, // "join" or "create"
  nexusUnread: {}, // Tracks unread message counts per nexusId

  setNexusActionView: (view) => set({ nexusActionView: view }),

  getNexuses: async () => {
    set({ isNexusesLoading: true });
    try {
      const res = await axiosInstance.get("/nexus/my");
      set({ nexuses: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load Orbits");
    } finally {
      set({ isNexusesLoading: false });
    }
  },

  createNexus: async (nexusData) => {
    try {
      const res = await axiosInstance.post("/nexus/create", nexusData);
      const socket = getSocket();
      socket.emit("joinNexusRoom", res.data._id);

      // Manually add the newly created Nexus to the state.
      // addNexus handles deduplication if the socket event also arrives.
      get().addNexus(res.data);

      toast.success(`Nexus "${res.data.name}" created!`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create Nexus");
      throw error;
    }
  },

  joinNexus: async (joinCode) => {
    try {
      const res = await axiosInstance.post("/nexus/join", { joinCode });
      
      const socket = getSocket();
      socket.emit("joinNexusRoom", res.data._id);

      // Manually add the joined Nexus to the state using the API response.
      // addNexus has deduplication to handle the case where the socket event also arrives.
      get().addNexus(res.data);

      toast.success(`Joined Nexus: ${res.data.name}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join Nexus");
      throw error;
    }
  },

  refreshNexus: async (nexusId) => {
    const maxRetries = 3;
    const retryDelays = [500, 1000, 2000]; // Exponential backoff
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await axiosInstance.get(`/nexus/${nexusId}`);
        const nexus = res.data;
        set((state) => ({
          selectedNexus: nexus,
          selectedNexusId: nexus._id?.toString(),
          nexuses: state.nexuses.map((n) =>
            n._id?.toString() === nexus._id?.toString() ? nexus : n,
          ),
        }));
        return nexus;
      } catch (error) {
        lastError = error;
        const currentState = get();

        if (error.response?.status === 403) {
          // 403: User not a member - might be sync delay
          if (attempt < maxRetries) {
            const retryDelay = retryDelays[attempt];
            console.warn(
              `[Nexus 403] Retry ${attempt + 1}/${maxRetries} after ${retryDelay}ms - ` +
                `membership may still be syncing for ${nexusId}`,
            );
            if (error.response?.data?.debug) {
              console.debug(
                "[Nexus 403] Backend membership check:",
                error.response.data.debug,
              );
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue; // Try again
          } else {
            // Final attempt failed - user truly lost access
            const authUser = useAuthStore.getState().authUser;
            console.error(
              `[Nexus 403] Access permanently denied after ${maxRetries} retries`,
              {
                nexusId,
                userId: authUser?._id,
                userName: authUser?.username,
              },
            );

            // Try diagnostic endpoint to get more info
            try {
              const diagRes = await axiosInstance.get(
                `/nexus/${nexusId}/check-membership`,
              );
              console.error("[Nexus 403] Diagnostic info:", diagRes.data);
            } catch (diagError) {
              console.error(
                "[Nexus 403] Could not fetch diagnostic info:",
                diagError.message,
              );
            }

            // Remove from list and deselect
            set((state) => ({
              selectedNexus: null,
              selectedNexusId: null,
              nexuses: state.nexuses.filter(
                (n) => n._id?.toString() !== nexusId.toString(),
              ),
            }));

            // Reload list to get current state
            try {
              const res = await axiosInstance.get("/nexus/my");
              set({ nexuses: res.data });
              toast.warning("You no longer have access to that Nexus");
            } catch (reloadError) {
              const errorMsg =
                reloadError?.message ||
                (typeof reloadError === "string"
                  ? reloadError
                  : "Unknown error");
              console.error(
                "Failed to reload Nexuses after access loss:",
                errorMsg,
              );
            }
            return;
          }
        } else if (error.response?.status === 404) {
          // Nexus was deleted
          console.warn(`[Nexus 404] Nexus ${nexusId} not found or deleted`);
          set((state) => ({
            selectedNexus: null,
            selectedNexusId: null,
            nexuses: state.nexuses.filter(
              (n) => n._id?.toString() !== nexusId.toString(),
            ),
          }));
          toast.warning("This Nexus was deleted");
          return;
        } else if (error.response?.status === 401) {
          // Auth token expired
          console.warn(
            "[Nexus 401] Authentication expired - prompting re-login",
          );
          toast.error("Your session expired. Please log in again.");
          // Auth store will handle logout
          return;
        } else {
          // Other errors (network, 500, etc) - don't retry on final attempt
          if (attempt < maxRetries) {
            const retryDelay = retryDelays[attempt];
            console.warn(
              `[Nexus] Network error, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries}):`,
              error.message,
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue;
          } else {
            const errorMsg =
              error?.message ||
              (typeof error === "string" ? error : "Unknown error");
            console.error("Failed to refresh nexus after retries:", errorMsg);
            // Keep local data, don't show disruptive error on transient failures
            return;
          }
        }
      }
    }
  },

  updateNexus: async (nexusId, updateData) => {
    try {
      const res = await axiosInstance.patch(`/nexus/${nexusId}`, updateData);
      const nexus = res.data;
      set((state) => ({
        selectedNexus: nexus,
        selectedNexusId: nexus._id?.toString(),
        nexuses: state.nexuses.map((n) =>
          n._id?.toString() === nexus._id?.toString() ? nexus : n,
        ),
      }));

      toast.success("Nexus updated successfully");
      return nexus;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update Nexus");
      throw error;
    }
  },

  removeNexusMember: async (nexusId, memberId) => {
    try {
      const res = await axiosInstance.patch(`/nexus/${nexusId}/remove-member`, {
        memberId,
      });
      const nexus = res.data;
      set((state) => ({
        selectedNexus: nexus,
        selectedNexusId: nexus._id?.toString(),
        nexuses: state.nexuses.map((n) =>
          n._id?.toString() === nexus._id?.toString() ? nexus : n,
        ),
      }));

      toast.success("Member removed");
      return nexus;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      throw error;
    }
  },

  leaveNexus: async (nexusId) => {
    try {
      await axiosInstance.patch(`/nexus/${nexusId}/leave`);
      // Tell socket server to remove us from this room
      getSocket().emit("leaveNexusRoom", nexusId);
      set((state) => ({
        selectedNexus: null,
        selectedNexusId: null,
        nexuses: state.nexuses.filter(
          (n) => n._id?.toString() !== nexusId?.toString(),
        ),
      }));

      toast.success("You left the Nexus");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave Nexus");
      throw error;
    }
  },

  getNexusMessages: async (nexusId) => {
    set({ isMessagesLoading: true, nexusMessages: [], hasMoreNexusMessages: true });
    try {
      const res = await axiosInstance.get(`/nexus/${nexusId}/messages`);
      set({ 
        nexusMessages: res.data, 
        hasMoreNexusMessages: res.data.length === 50
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreNexusMessages: async (nexusId) => {
    const { nexusMessages, isLoadingMoreParams, hasMoreNexusMessages } = get();
    if (isLoadingMoreParams || !hasMoreNexusMessages || nexusMessages.length === 0) return;

    set({ isLoadingMoreParams: true });
    try {
      const cursor = nexusMessages[0].createdAt;
      const res = await axiosInstance.get(`/nexus/${nexusId}/messages?cursor=${cursor}`);
      
      set((state) => ({ 
        nexusMessages: [...res.data, ...state.nexusMessages],
        hasMoreNexusMessages: res.data.length === 50
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load older messages");
    } finally {
      set({ isLoadingMoreParams: false });
    }
  },

  sendNexusMessage: async (nexusId, messageData) => {
    const { addNexusMessage } = get();
    const idempotencyKey = crypto.randomUUID();
    const authUser = useAuthStore.getState().authUser;

    const optimisticMessage = {
      _id: idempotencyKey,
      senderId: authUser,
      nexusId,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      idempotencyKey,
      status: "pending"
    };

    if (!navigator.onLine) {
      const { pushToQueue } = await import("../lib/offlineQueue.js");
      await pushToQueue({ ...optimisticMessage, targetId: nexusId, type: "nexus" });
      addNexusMessage(optimisticMessage);
      return optimisticMessage;
    }

    try {
      addNexusMessage(optimisticMessage);
      
      const res = await axiosInstance.post(
        `/nexus/${nexusId}/send`,
        { ...messageData, idempotencyKey }
      );
      return res.data;
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        const { pushToQueue } = await import("../lib/offlineQueue.js");
        await pushToQueue({ ...optimisticMessage, targetId: nexusId, type: "nexus" });
        return optimisticMessage;
      }
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  retryNexusMessage: async (idempotencyKey) => {
    const state = get();
    const msg = state.nexusMessages.find(m => m.idempotencyKey === idempotencyKey);
    if (!msg) return;

    set((s) => ({
      nexusMessages: s.nexusMessages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "sending" } : m)
    }));

    try {
      const targetId = msg.nexusId?._id || msg.nexusId;
      await axiosInstance.post(`/nexus/${targetId}/send`, {
        text: msg.text,
        image: msg.image,
        idempotencyKey: msg.idempotencyKey
      });
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const { pushToQueue } = await import("../lib/offlineQueue.js");
        const targetId = msg.nexusId?._id || msg.nexusId;
        await pushToQueue({ ...msg, targetId: targetId, type: "nexus", status: "pending" });
        set((s) => ({
          nexusMessages: s.nexusMessages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "pending" } : m)
        }));
      } else {
        set((s) => ({
          nexusMessages: s.nexusMessages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "failed" } : m)
        }));
      }
    }
  },

  // Diagnostic function to check membership status
  checkMembership: async (nexusId) => {
    try {
      const res = await axiosInstance.get(`/nexus/${nexusId}/check-membership`);
      console.info("[Nexus Membership Check]", res.data);
      return res.data;
    } catch (error) {
      const errorMsg =
        error?.message || (typeof error === "string" ? error : "Unknown error");
      console.error("Failed to check membership:", errorMsg);
      return null;
    }
  },

  nexusTypingUsers: [],

  setNexusTyping: (userId, username, isTyping) => {
    set((state) => {
      const existing = state.nexusTypingUsers || [];
      const normalizedId = userId?.toString?.();

      if (isTyping) {
        if (existing.some((u) => u.userId?.toString?.() === normalizedId)) {
          return state;
        }
        return {
          nexusTypingUsers: [...existing, { userId: normalizedId, username }],
        };
      }

      return {
        nexusTypingUsers: existing.filter(
          (user) => user.userId?.toString?.() !== normalizedId,
        ),
      };
    });
  },

  clearNexusTyping: () => {
    set({ nexusTypingUsers: [] });
  },

  setSelectedNexus: (nexus) => {
    if (nexus) {
      const nid = nexus._id?.toString();
      set((state) => ({
        selectedNexus: nexus,
        selectedNexusId: nid,
        nexusActionView: null,
        nexusUnread: { ...state.nexusUnread, [nid]: 0 },
      }));
    } else {
      set({ selectedNexus: null, selectedNexusId: null, nexusActionView: null });
    }
  },

  addNexus: (nexus) => {
    set((state) => {
      const exists = state.nexuses.some((n) => n._id?.toString() === nexus._id?.toString());
      if (exists) return state;
      return { nexuses: [nexus, ...state.nexuses] };
    });
  },
  addNexusMessage: (message) => {
    const { selectedNexus, nexusMessages, nexusUnread } = get();
    const msgNexusId = message.nexusId?.toString?.() ?? message.nexusId;
    const selNexusId = selectedNexus?._id?.toString?.() ?? selectedNexus?._id;

    if (selectedNexus && msgNexusId === selNexusId) {
      const normalizeId = (id) => (id == null ? id : id.toString());
      const exists = nexusMessages.some(
        (m) => normalizeId(m._id) === normalizeId(message._id) || (m.idempotencyKey && m.idempotencyKey === message.idempotencyKey),
      );
      if (!exists) {
        const newMessages = [...nexusMessages, message].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        set({ nexusMessages: newMessages });
      }
    } else {
      // Increment unread count if not selected
      const currentCount = nexusUnread[msgNexusId] || 0;
      set({
        nexusUnread: {
          ...nexusUnread,
          [msgNexusId]: currentCount + 1,
        },
      });
    }
  },
}));
