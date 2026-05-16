import { create } from "zustand";
import toast from "../lib/toast";
import { axiosInstance } from "../lib/axios.jsx";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "./useAuthStore";
import { normalizeId, isMatchObj } from "../lib/idUtils";

// Track re-distribution requests sent per session to avoid spamming
const requestedKeyResends = new Set();

// ── Decrypt a single Nexus message (v4 Sender Key) ───────────────────────────
const decryptSingleNexusMessage = async (m, userId) => {
  // Use .id to prefer the obfuscated ID when loading the key
  const sIdStr = (m.senderId?.id || m.senderId?._id || m.senderId)?.toString();
  const isSender = isMatchObj(userId, m.senderId);

  if (m.v !== 4 || !m.ciphertext) return { ...m, isMe: isSender };

  // Sender's own message — skip decryption (advanced chain)
  if (isSender) return { ...m, isMe: true };

  try {
    const { loadSenderKey, saveSenderKey } = await import("../lib/nexusKeyStore.js");
    const { senderKeyDecrypt } = await import("../lib/nexusSenderKey.js");

    const nexusId = (m.nexusId?._id || m.nexusId)?.toString();
    const senderKey = await loadSenderKey(nexusId, sIdStr);

    if (!senderKey) {
      const pairKey = `${nexusId}:${sIdStr}`;
      if (!requestedKeyResends.has(pairKey)) {
        requestedKeyResends.add(pairKey);
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("request-sender-key-distribution", { nexusId, targetUserId: sIdStr });
        }
      }
      return { ...m, text: "🔒 [Sender key missing — sync required]", isMe: false };
    }

    const { plaintext, updatedSenderKey } = await senderKeyDecrypt(
      senderKey,
      m,
      senderKey.signingPublicKey
    );
    await saveSenderKey(nexusId, sIdStr, updatedSenderKey);

    const payload = JSON.parse(plaintext);
    return { ...m, text: payload.text, image: payload.image, isMe: false };
  } catch (err) {
    console.error("[Nexus E2EE] Decrypt error:", err);
    return { ...m, text: "🔒 [Decryption failed]", isMe: false };
  }
};

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
      // Ensure we always store an array
      const nexuses = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      set({ nexuses });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load Orbits");
    } finally {
      set({ isNexusesLoading: false });
    }
  },

  deleteNexus: async (nexusId) => {
    try {
      await axiosInstance.delete(`/nexus/${nexusId}`);
      set((state) => ({
        nexuses: state.nexuses.filter((n) => n._id?.toString() !== nexusId?.toString()),
        selectedNexus: state.selectedNexus?._id?.toString() === nexusId?.toString() ? null : state.selectedNexus,
        selectedNexusId: state.selectedNexusId === nexusId?.toString() ? null : state.selectedNexusId,
      }));
      toast.success("Nexus deleted permanently");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete Nexus");
      throw error;
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
    const currentMessages = get().nexusMessages;
    const currentId = get().selectedNexusId;
    
    // Prevent redundant fetches for the same Nexus if already loading
    if (get().isMessagesLoading && nexusId === currentId) {
      return;
    }

    // Only wipe if we're switching to a new Nexus
    const shouldWipe = nexusId !== currentId || currentMessages.length === 0;

    if (shouldWipe) {
      set({ isMessagesLoading: true, nexusMessages: [], hasMoreNexusMessages: true });
    } else {
      set({ isMessagesLoading: true });
    }
    
    // Ensure socket joins this nexus room for real-time messages when history is fetched
    if (nexusId) {
      getSocket().emit("joinNexusRoom", nexusId);
    }
    
    try {
      const res = await axiosInstance.get(`/nexus/${nexusId}/messages`);
      const authUser = useAuthStore.getState().authUser;
      const userId = authUser?._id?.toString();

      // 1. Sync missing sender keys for this Nexus
      await get().syncNexusKeys(nexusId);

      // 2. Decrypt all messages
      const decrypted = await Promise.all(
        res.data.map(m => decryptSingleNexusMessage(m, userId))
      );

      set({ 
        nexusMessages: decrypted, 
        hasMoreNexusMessages: decrypted.length === 50
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

      // Sync missing sender keys before decrypting older messages
      await get().syncNexusKeys(nexusId);

      const authUser = useAuthStore.getState().authUser;
      const userId = authUser?._id?.toString();
      const decrypted = await Promise.all(
        res.data.map(m => decryptSingleNexusMessage(m, userId))
      );
      
      set((state) => ({ 
        nexusMessages: [...decrypted, ...state.nexusMessages],
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

    // 1. Instant optimistic UI update
    addNexusMessage(optimisticMessage);

    // 2. Fire-and-forget background encryption & send
    (async () => {
      try {
        const authUser = useAuthStore.getState().authUser;
        const userId = authUser?._id?.toString();

        // ── Nexus E2EE logic ──────────────────────────────────────────────────
        const { loadSenderKey, saveSenderKey } = await import("../lib/nexusKeyStore.js");
        const { senderKeyEncrypt, generateSenderKey } = await import("../lib/nexusSenderKey.js");

        let senderKey = await loadSenderKey(nexusId, userId);
        
        // If first message in this nexus, or key missing: generate and distribute
        if (!senderKey) {
          senderKey = await generateSenderKey();
          await saveSenderKey(nexusId, userId, senderKey);
          await get().distributeNexusKey(nexusId, senderKey);
        }

        const payload = JSON.stringify({ text: messageData.text, image: messageData.image });
        const { ciphertext, updatedSenderKey } = await senderKeyEncrypt(senderKey, payload);
        await saveSenderKey(nexusId, userId, updatedSenderKey);

        const apiPayload = { ...ciphertext, idempotencyKey };
        // Only include plaintext if we somehow failed to encrypt (fallback)
        if (!ciphertext || !ciphertext.ciphertext) {
          apiPayload.text = messageData.text;
          apiPayload.image = messageData.image;
        }

        const res = await axiosInstance.post(
          `/nexus/${nexusId}/send`,
          Object.fromEntries(Object.entries(apiPayload).filter(([, v]) => v != null))
        );
        
        // Decrypt our own outgoing message (just sets status to sent and maps IDs)
        const finalMsg = await decryptSingleNexusMessage(res.data, userId);
        
        // Replace optimistic msg but preserve local plaintext since server no longer returns it
        set((state) => ({
          nexusMessages: state.nexusMessages.map(m => 
            m.idempotencyKey === idempotencyKey ? { ...finalMsg, text: m.text, image: m.image } : m
          )
        }));
      } catch (error) {
        if (error.code === 'ERR_NETWORK') {
          const { pushToQueue } = await import("../lib/offlineQueue.js");
          await pushToQueue({ ...optimisticMessage, targetId: nexusId, type: "nexus" });
        } else {
          toast.error(error.response?.data?.message || "Failed to send message");
          set((state) => ({
            nexusMessages: state.nexusMessages.map(m => 
              m.idempotencyKey === idempotencyKey ? { ...m, status: "failed" } : m
            )
          }));
        }
      }
    })();

    return optimisticMessage;
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
      const retryPayload = {
        idempotencyKey: msg.idempotencyKey,
        v: msg.v,
        ciphertext: msg.ciphertext,
        iv: msg.iv,
        n: msg.n,
        sig: msg.sig,
      };
      
      // Fallback to sending plaintext only if not encrypted
      if (!msg.ciphertext) {
        retryPayload.text = msg.text;
        retryPayload.image = msg.image;
      }

      await axiosInstance.post(`/nexus/${targetId}/send`,
        Object.fromEntries(Object.entries(retryPayload).filter(([, v]) => v != null))
      );
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
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
    const normalizedId = userId?.toString?.();
    set((state) => {
      const existing = state.nexusTypingUsers || [];

      if (isTyping) {
        // Quick check
        if (existing.some((u) => u.userId === normalizedId)) return state;
        
        // Auto-clear timer for nexus typing
        const timerKey = `_nexusTyping_${normalizedId}`;
        if (state[timerKey]) clearTimeout(state[timerKey]);
        const timer = setTimeout(() => get().setNexusTyping(normalizedId, username, false), 3500);

        return {
          nexusTypingUsers: [...existing, { userId: normalizedId, username }],
          [timerKey]: timer
        };
      }

      return {
        nexusTypingUsers: existing.filter((u) => u.userId !== normalizedId),
      };
    });
  },

  clearNexusTyping: () => {
    set({ nexusTypingUsers: [] });
  },

  setSelectedNexus: (nexus) => {
    if (!nexus) {
      set({ selectedNexus: null, selectedNexusId: null, nexusActionView: null });
      return;
    }

    // Resolve the real _id from the existing nexuses list if possible
    const nexuses = get().nexuses;
    const targetId = (nexus._id || nexus.id || nexus).toString();
    const resolvedNexus = nexuses.find(n => n._id === targetId || n.id === targetId);
    
    const realId = resolvedNexus?._id || nexus._id || (targetId.startsWith("orb_") ? null : targetId);
    const nid = realId ? realId.toString() : targetId;

    // Ensure socket joins this nexus room for real-time messages
    const socketId = resolvedNexus?._id || nexus._id || targetId;
    if (socketId) {
      getSocket().emit("joinNexusRoom", socketId);
    }

    set((state) => ({
      selectedNexus: resolvedNexus || (typeof nexus === 'object' ? nexus : null),
      selectedNexusId: nid,
      nexusActionView: null,
      nexusUnread: { ...state.nexusUnread, [nid]: 0 },
    }));
  },

  markNexusSeen: (nexusId) => {
    const { socket } = useAuthStore.getState();
    if (!socket || !nexusId) return;

    const { nexusMessages } = get();
    // Use the latest non-system message
    const lastMsg = [...nexusMessages].reverse().find(m => !m.isSystem);

    if (lastMsg) {
      socket.emit("seen", {
        messageId: lastMsg._id,
        conversationId: nexusId,
        conversationType: "nexus"
      });
    }
  },

  addNexus: (nexus) => {
    set((state) => {
      const exists = state.nexuses.some((n) => n._id?.toString() === nexus._id?.toString());
      if (exists) return state;
      return { nexuses: [nexus, ...state.nexuses] };
    });
  },
  addNexusMessage: async (message) => {
    const msgNexusId = message.nexusId?.toString();

    // Sync sender keys before decryption so real-time messages don't fail
    await get().syncNexusKeys(msgNexusId);

    set((state) => {
      const { selectedNexusId, selectedNexus, nexusMessages, nexusUnread, nexuses } = state;
      const msgNexusId = message.nexusId?.toString();

      const belongsToCurrentNexus = !!selectedNexus && (
        selectedNexus._id?.toString() === msgNexusId ||
        selectedNexus.id?.toString() === msgNexusId
      );

      if (belongsToCurrentNexus) {
        const authUser = useAuthStore.getState().authUser;
        const userId = authUser?._id?.toString();
        
        decryptSingleNexusMessage(message, userId).then(decrypted => {
          const messageId = decrypted._id?.toString();
          const idempotencyKey = decrypted.idempotencyKey;

          set(s => {
            let newMessages = [...s.nexusMessages];
            const existsIndex = newMessages.findLastIndex((m) => {
              if (idempotencyKey && m.idempotencyKey === idempotencyKey) return true;
              if (messageId && m._id?.toString() === messageId) return true;
              return false;
            });

            if (existsIndex === -1) {
              newMessages.push(decrypted);
              if (newMessages.length > 1 && 
                  new Date(newMessages[newMessages.length - 2].createdAt).getTime() > 
                  new Date(decrypted.createdAt).getTime()) {
                newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              }
            } else {
              newMessages[existsIndex] = {
                ...decrypted,
                _id: newMessages[existsIndex]._id || decrypted._id,
                status: "sent",
              };
            }
            return { nexusMessages: newMessages };
          });
        }).catch(decErr => {
          console.error("[Nexus E2EE] Message decrypt failed, showing encrypted notice:", decErr);
          set(s => ({
            nexusMessages: [...s.nexusMessages, { ...message, text: "🔒 [Decryption failed]", isMe: false }],
          }));
        });

        return state;
      } else {
        const currentCount = nexusUnread[msgNexusId] || 0;
        return {
          nexusUnread: {
            ...nexusUnread,
            [msgNexusId]: currentCount + 1,
          },
        };
      }
    });
  },

  updateNexusMessage: (nexusId, messageId, updates) => {
    const { selectedNexus, nexusMessages } = get();
    const nid = nexusId?.toString();
    if (selectedNexus?._id?.toString() === nid || selectedNexus?.id?.toString() === nid) {
      set({
        nexusMessages: nexusMessages.map((m) =>
          m._id?.toString() === messageId?.toString() ? { ...m, ...updates } : m
        ),
      });
    }
  },

  deleteNexusMessage: (nexusId, messageId) => {
    const { selectedNexus, nexusMessages } = get();
    const nid = nexusId?.toString();
    if (selectedNexus?._id?.toString() === nid || selectedNexus?.id?.toString() === nid) {
      set({
        nexusMessages: nexusMessages.filter((m) => m._id?.toString() !== messageId?.toString()),
      });
    }
  },

  markNexusMessageSeen: (nexusId, messageId, seenAt) => {
    const { selectedNexus, nexusMessages } = get();
    const nid = nexusId?.toString();
    if (selectedNexus?._id?.toString() === nid || selectedNexus?.id?.toString() === nid) {
      set({
        nexusMessages: nexusMessages.map((m) =>
          m._id?.toString() === messageId?.toString() ? { ...m, seenAt } : m
        ),
      });
    }
  },

  // ── Nexus E2EE Key Management ─────────────────────────────────────────────────

  distributeNexusKey: async (nexusId, senderKey) => {
    try {
      const { x3dhSender } = await import("../lib/x3dh.js");
      const { createDistributionPayload } = await import("../lib/nexusSenderKey.js");
      const { getKeyPair } = await import("../lib/keyStore.js");
      const authUser = useAuthStore.getState().authUser;
      const myId = authUser?._id?.toString();

      // 1. Fetch all members' prekey bundles
      const res = await axiosInstance.get(`/nexus/${nexusId}/member-keys`);
      const members = res.data.members;

      let myKeys = await getKeyPair(myId);
      if (!myKeys) {
        // initE2EE is fire-and-forget on login — keys may still be writing.
        // Retry with backoff before giving up.
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(r => setTimeout(r, 300));
          myKeys = await getKeyPair(myId);
          if (myKeys) break;
        }
        if (!myKeys) throw new Error("Local identity keys missing");
      }

      // 2. Create X3DH-wrapped distributions for each member
      const payload = createDistributionPayload(senderKey, nexusId, myId);
      const distributions = await Promise.all(members.map(async (m) => {
        const { sessionKey, ephemeralPublicKey, oneTimePrekeyId } = await x3dhSender({
          senderIdentityPrivateKey: myKeys.privateKey,
          recipientBundle: m,
        });

        // Use the X3DH session key to encrypt the sender key distribution payload
        const aesKey = await crypto.subtle.importKey(
          "raw", sessionKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          aesKey,
          new TextEncoder().encode(payload)
        );

        const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
        return {
          recipientId: m.userId,
          ciphertext:  buf2b64(ct),
          iv:          buf2b64(iv),
          x3dh: {
            identityKey:  await (async () => {
              const spki = await crypto.subtle.exportKey("spki", myKeys.publicKey);
              return btoa(String.fromCharCode(...new Uint8Array(spki)));
            })(),
            ephemeralKey: ephemeralPublicKey,
            opkId:        oneTimePrekeyId,
          }
        };
      }));

      // 3. Publish to backend
      await axiosInstance.post(`/nexus/${nexusId}/sender-keys`, { distributions });
    } catch (err) {
      console.error("[Nexus E2EE] Failed to distribute keys:", err);
      toast.error("Group security setup failed. Your messages may not be readable by others.");
      throw err;
    }
  },

  syncNexusKeys: async (nexusId) => {
    // Basic debounce/locking to prevent spamming key sync
    const state = get();
    if (state._syncingKeys === nexusId) return;
    set({ _syncingKeys: nexusId });

    try {
      const { x3dhReceiver } = await import("../lib/x3dh.js");
      const { parseDistributionPayload } = await import("../lib/nexusSenderKey.js");
      const { saveSenderKey, hasSenderKey } = await import("../lib/nexusKeyStore.js");
      const { getSignedPrekey, consumeOneTimePrekey } = await import("../lib/sessionStore.js");
      const { getKeyPair } = await import("../lib/keyStore.js");
      const authUser = useAuthStore.getState().authUser;
      const myId = authUser?._id?.toString();

      // 1. Fetch distributions addressed to me
      const res = await axiosInstance.get(`/nexus/${nexusId}/sender-keys`);
      const dists = res.data?.distributions;
      if (!Array.isArray(dists)) return;

      const myKeys = await getKeyPair(myId);
      if (!myKeys) return;

      for (const d of dists) {
        if (!d?.x3dh?.identityKey || !d?.x3dh?.ephemeralKey) {
          console.warn("[Nexus E2EE] Malformed distribution — missing x3dh header, skipping", d.senderId);
          continue;
        }
        // Skip if we already have a newer or same key (unless it's a rotation)
        // For now, we always process to ensure we're up to date
        try {
          const spk = await getSignedPrekey(myId);
          if (!spk) {
            console.warn("[Nexus E2EE] No signed prekey found, skipping distribution from", d.senderId);
            continue;
          }

          const opkId = d.x3dh?.opkId;
          let opkPriv = null;
          if (opkId) {
            opkPriv = await consumeOneTimePrekey(myId, opkId);
            if (!opkPriv) {
              // OPK consumed or rotated during re-login — can't decrypt this distribution.
              // Request the sender to re-distribute their key with fresh OPKs.
              const pairKey = `${nexusId}:${d.senderId}`;
              if (!requestedKeyResends.has(pairKey)) {
                requestedKeyResends.add(pairKey);
                const socket = getSocket();
                if (socket?.connected) {
                  socket.emit("request-sender-key-distribution", {
                    nexusId,
                    targetUserId: d.senderId,
                  });
                }
                console.warn("[Nexus E2EE] Requested sender key re-distribution from", d.senderId);
              }
              continue;
            }
          }

          const sessionKey = await x3dhReceiver({
            recipientIdentityPrivateKey: myKeys.privateKey,
            signedPrekeyPrivateKey:      spk.privateKey,
            oneTimePrekeyPrivateKey:     opkPriv,
            senderHeader: {
              identityKey:  d.x3dh.identityKey,
              ephemeralKey: d.x3dh.ephemeralKey,
            },
          });

          const aesKey = await crypto.subtle.importKey(
            "raw", sessionKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
          );
          const b64toBuf = (b64) => {
            const bin = atob(b64);
            const buf = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            return buf.buffer;
          };

          const plainBuf = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(b64toBuf(d.iv)) },
            aesKey,
            b64toBuf(d.ciphertext)
          );

          const payload = new TextDecoder().decode(plainBuf);
          const senderKey = parseDistributionPayload(payload);
          
          await saveSenderKey(nexusId, d.senderId, senderKey);
        } catch (decErr) {
          console.warn("[Nexus E2EE] Failed to decrypt distribution from", d.senderId, decErr);
        }
      }
    } catch (err) {
      console.error("[Nexus E2EE] Sync error:", err);
    } finally {
      set({ _syncingKeys: null });
    }
  },

  rotateNexusKey: async (nexusId) => {
    try {
      const { clearNexusSenderKeys } = await import("../lib/nexusKeyStore.js");
      const authUser = useAuthStore.getState().authUser;
      const myId = authUser?._id?.toString();

      // Clear our own sender key for this nexus
      await clearNexusSenderKeys(nexusId);
      console.info(`[Nexus E2EE] Rotated key for Nexus ${nexusId} due to membership change`);
    } catch (err) {
      console.error("[Nexus E2EE] Rotation error:", err);
    }
  },

  addNexusMember: (nexusId, user) => {
    set((state) => {
      const nexuses = state.nexuses.map((n) => {
        if (n._id?.toString() === nexusId?.toString()) {
          const exists = n.members?.some(m => (m._id || m).toString() === (user._id || user).toString());
          if (exists) return n;
          return { ...n, members: [...(n.members || []), user] };
        }
        return n;
      });
      
      const selectedNexus = state.selectedNexus?._id?.toString() === nexusId?.toString()
        ? { ...state.selectedNexus, members: [...(state.selectedNexus.members || []), user] }
        : state.selectedNexus;

      return { nexuses, selectedNexus };
    });
    
    // Member joined -> Rotate key (future secrecy)
    get().rotateNexusKey(nexusId);
  },

  removeNexusMemberSocket: (nexusId, userId) => {
    set((state) => {
      const nexuses = state.nexuses.map((n) => {
        if (n._id?.toString() === nexusId?.toString()) {
          return { ...n, members: (n.members || []).filter(m => (m._id || m).toString() !== userId?.toString()) };
        }
        return n;
      });

      const selectedNexus = state.selectedNexus?._id?.toString() === nexusId?.toString()
        ? { ...state.selectedNexus, members: (state.selectedNexus.members || []).filter(m => (m._id || m).toString() !== userId?.toString()) }
        : state.selectedNexus;

      return { nexuses, selectedNexus };
    });

    // Member left -> Rotate key (post-compromise security)
    get().rotateNexusKey(nexusId);
  },
}));
