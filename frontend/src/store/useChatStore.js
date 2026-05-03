import { create } from "zustand";
import toast from "../lib/toast";
import { axiosInstance } from "../lib/axios.jsx";
import { useAuthStore } from "./useAuthStore";

const decryptMessagesList = async (messages) => {
  const { e2eeKeys, authUser } = useAuthStore.getState();
  if (!e2eeKeys || !messages || !messages.length) return messages;
  
  const { decryptMessage } = await import("../lib/e2ee.js");
  const authUserId = authUser?._id?.toString();

  return await Promise.all(messages.map(async (m) => {
    const sIdStr  = (m.senderId?._id || m.senderId?.id || m.senderId)?.toString();
    const isSender = sIdStr === authUserId;
    
    if (m.encryptedContent) {
      const decrypted = await decryptMessage(m, e2eeKeys.privateKey, isSender);
      if (decrypted) {
        return { ...m, text: decrypted.text, image: decrypted.image, isMe: isSender };
      }
    }
    return { ...m, isMe: isSender };
  }));
};

export const useChatStore = create((set, get) => ({
  messages: [],
  hasMoreMessages: true,
  users: [],
  contactList: [],
  contactAliases: {},
  isUsersLoading: false,
  isMessagesLoading: false,
  isLoadingMoreParams: false,
  selectedUser: null,
  selectedConversationId: null, // Tracked for component synchronization
  selectedConversationType: null, // "direct" or "nexus" (though only "direct" here)

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      const users = res.data.data || [];
      const userIds = users.map((user) => user._id.toString());
      set((state) => ({
        users: users.map(u => {
          const existing = state.users.find(eu => eu._id === u._id);
          // Prefer server unreadCount if available, else keep existing local count
          return { ...u, unreadCount: u.unreadCount !== undefined ? u.unreadCount : (existing?.unreadCount || 0) };
        }),
        contactList: state.contactList?.length ? state.contactList : userIds,
        // preserve existing alias map
        contactAliases: state.contactAliases || {},
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    const currentMessages = get().messages;
    const currentId = get().selectedConversationId;

    // Only wipe if we're switching to a new user
    const shouldWipe = userId !== currentId || currentMessages.length === 0;

    if (shouldWipe) {
      set({ isMessagesLoading: true, messages: [], hasMoreMessages: true });
    } else {
      set({ isMessagesLoading: true });
    }
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      const decrypted = await decryptMessagesList(res.data);
      set({ 
        messages: decrypted, 
        hasMoreMessages: res.data.length === 50 
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async (userId) => {
    const { messages, isLoadingMoreParams, hasMoreMessages } = get();
    if (isLoadingMoreParams || !hasMoreMessages || messages.length === 0) return;

    set({ isLoadingMoreParams: true });
    try {
      const cursor = messages[0].createdAt;
      const res = await axiosInstance.get(`/message/${userId}?cursor=${cursor}`);
      const decrypted = await decryptMessagesList(res.data);
      
      set((state) => ({ 
        messages: [...decrypted, ...state.messages],
        hasMoreMessages: res.data.length === 50
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load older messages");
    } finally {
      set({ isLoadingMoreParams: false });
    }
  },

  sendMessage: async (userId, text, image) => {
    const { addMessage } = get();
    const idempotencyKey = crypto.randomUUID();
    
    // Optimistic payload construction
    const authUser = useAuthStore.getState().authUser;
    const optimisticMessage = {
      _id: idempotencyKey, // Temporary ID matching idempotency
      senderId: authUser,
      receiverId: { _id: userId },
      text,
      image,
      createdAt: new Date().toISOString(),
      idempotencyKey,
      status: "pending",
    };

    // If natively offline, drop straight into IndexedDB Queue
    if (!navigator.onLine) {
      const { pushToQueue } = await import("../lib/offlineQueue.js");
      await pushToQueue({ ...optimisticMessage, targetId: userId, type: "direct" });
      addMessage(optimisticMessage);
      return optimisticMessage;
    }

    try {
      // Show immediately in UI with pending state
      await addMessage(optimisticMessage);

      let payload = { text, image, idempotencyKey };

      const e2eeKeys = useAuthStore.getState().e2eeKeys;
      const targetUser = get().users.find(u => u._id === userId || u.id === userId);

      if (e2eeKeys && targetUser && targetUser.publicKey) {
        try {
          const { encryptMessage } = await import("../lib/e2ee.js");
          const encrypted = await encryptMessage(
            { text, image },
            e2eeKeys.publicKey,
            targetUser.publicKey
          );
          payload = {
            idempotencyKey,
            ...encrypted
          };
        } catch (encErr) {
          console.error("Encryption failed, falling back to plaintext", encErr);
        }
      }

      const res = await axiosInstance.post(`/message/send/${userId}`, payload);

      // Await so the optimistic message is correctly resolved to "sent" before any other state update
      await addMessage(res.data);
      return res.data;
    } catch (error) {
      // Network drop exactly mid-flight
      if (error.code === 'ERR_NETWORK' || !error.response) {
        const { pushToQueue } = await import("../lib/offlineQueue.js");
        await pushToQueue({ ...optimisticMessage, targetId: userId, type: "direct" });
        return optimisticMessage;
      }
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  syncOfflineQueue: async () => {
    if (!navigator.onLine) return;
    const { getQueue, removeFromQueue } = await import("../lib/offlineQueue.js");
    const queue = await getQueue();
    if (queue.length === 0) return;

    // To prevent multi-tab conflict, basic lock
    if (localStorage.getItem("orbit_sync_lock") === "1") return;
    localStorage.setItem("orbit_sync_lock", "1");

    try {
      for (const msg of queue) {
        // Ensure idempotency Key exists
        if (!msg.idempotencyKey) continue;
        
        // Update local state to "sending" (Optional visual cue)
        set((state) => ({
          messages: state.messages.map(m => m.idempotencyKey === msg.idempotencyKey ? { ...m, status: "sending" } : m)
        }));

        try {
          if (msg.type === "direct") {
             const targetId = msg.targetId || (msg.receiverId?._id) || msg.receiverId;
             await axiosInstance.post(`/message/send/${targetId}`, {
               text: msg.text,
               image: msg.image,
               idempotencyKey: msg.idempotencyKey
             });
          } else if (msg.type === "nexus") {
             const targetId = msg.targetId || (msg.nexusId?._id) || msg.nexusId;
             await axiosInstance.post(`/nexus/${targetId}/send`, {
               text: msg.text,
               image: msg.image,
               idempotencyKey: msg.idempotencyKey
             });
             // Import useNexusStore dynamically to strictly avoid loop issues if any
             const { useNexusStore } = await import("./useNexusStore.js");
             useNexusStore.setState((state) => ({
                nexusMessages: state.nexusMessages.map(m => m.idempotencyKey === msg.idempotencyKey ? { ...m, status: "sending" } : m)
             }));
          }
          // Remove from local IndexedDB
          await removeFromQueue(msg.idempotencyKey);
        } catch (err) {
          // If server rejects (4xx) not network error, still drop it
          if (err.response && err.response.status >= 400 && err.response.status < 500) {
             await removeFromQueue(msg.idempotencyKey);
          }
        }
      }
    } finally {
      localStorage.removeItem("orbit_sync_lock");
    }
  },

  retryMessage: async (idempotencyKey) => {
    const state = get();
    const msg = state.messages.find(m => m.idempotencyKey === idempotencyKey);
    if (!msg) return;

    // Flip UI instantly to sending
    set((s) => ({
      messages: s.messages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "sending" } : m)
    }));

    // It might be a direct message. Currently, retryMessage is only called on the current active chat via UI anyway.
    const targetId = msg.receiverId?._id || msg.receiverId;

    let payload = {
      text: msg.text,
      image: msg.image,
      idempotencyKey: msg.idempotencyKey
    };

    // Re-encrypt if E2EE keys are available
    const e2eeKeys = useAuthStore.getState().e2eeKeys;
    const targetUser = state.users.find(u => u._id === targetId || u.id === targetId);

    if (e2eeKeys && targetUser && targetUser.publicKey) {
      try {
        const { encryptMessage } = await import("../lib/e2ee.js");
        const encrypted = await encryptMessage(
          { text: msg.text, image: msg.image },
          e2eeKeys.publicKey,
          targetUser.publicKey
        );
        payload = { ...payload, ...encrypted };
      } catch (encErr) {
        console.error("[Retry] Encryption failed:", encErr);
      }
    }

    try {
      await axiosInstance.post(`/message/send/${targetId}`, payload);
      // The socket ack will override this, but we optimistically clear it
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        // Drop it back into the offline queue!
        const { pushToQueue } = await import("../lib/offlineQueue.js");
        await pushToQueue({ ...msg, targetId: targetId, type: "direct", status: "pending" });
        set((s) => ({
          messages: s.messages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "pending" } : m)
        }));
      } else {
        // Standard fail
        set((s) => ({
          messages: s.messages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "failed" } : m)
        }));
      }
    }
  },

  addMessage: async (message) => {
    const [decryptedMsg] = await decryptMessagesList([message]);
    
    set((state) => {
      // Utility: extract a plain string ID from a string or object
      const normalizeId = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        return (obj._id || obj.id || '').toString() || null;
      };

      // Utility: check if a string ID (targetId) matches the _id or id of a user object
      const isMatchObj = (targetId, userObj) => {
        if (!targetId || !userObj) return false;
        const tId = targetId.toString();
        if (typeof userObj === 'string') return userObj === tId;
        if (userObj._id?.toString() === tId) return true;
        if (userObj.id?.toString() === tId) return true;
        // Fallback: resolve through users list when formats differ
        return state.users.some(u =>
          (u._id?.toString() === tId || u.id?.toString() === tId) &&
          (u._id?.toString() === normalizeId(userObj) || u.id?.toString() === normalizeId(userObj))
        );
      };

      const currentSelectedId = state.selectedConversationId
        || normalizeId(state.selectedUser);

      const belongsToCurrentChat = !!currentSelectedId && (
        isMatchObj(currentSelectedId, decryptedMsg.senderId) ||
        isMatchObj(currentSelectedId, decryptedMsg.receiverId)
      );

      if (!belongsToCurrentChat) {
        console.log(`[ChatStore] Message ignored: current selection ${currentSelectedId} does not match sender ${normalizeId(decryptedMsg.senderId)} or receiver ${normalizeId(decryptedMsg.receiverId)}`);
      }

      let newMessages = [...state.messages];
      const users = [...state.users];

      if (belongsToCurrentChat) {
        const messageId = normalizeId(decryptedMsg);
        const idempotencyKey = decryptedMsg.idempotencyKey;

        const existsIndex = newMessages.findIndex((m) => {
          const mId = normalizeId(m);
          if (mId && messageId && mId === messageId) return true;
          if (m.idempotencyKey && idempotencyKey && m.idempotencyKey === idempotencyKey) return true;
          return false;
        });

        if (existsIndex === -1) {
          newMessages.push(decryptedMsg);
        } else {
          const existingMsg = newMessages[existsIndex];
          newMessages[existsIndex] = {
            ...decryptedMsg,
            _id: decryptedMsg._id || existingMsg._id,
            status: "sent",
          };
        }

        newMessages.sort((a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      }

      // Update sidebar preview / unread badge
      const updatedUsers = users.map((user) => {
        if (isMatchObj(user._id || user.id, decryptedMsg.senderId)) {
          return {
            ...user,
            lastMessage: message.text || "Shared an image",
            unreadCount: !belongsToCurrentChat ? (user.unreadCount || 0) + 1 : 0,
          };
        }
        if (isMatchObj(user._id || user.id, decryptedMsg.receiverId)) {
          return { ...user, lastMessage: "You sent a message" };
        }
        return user;
      });

      return { messages: newMessages, users: updatedUsers };
    });
  },

  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id?.toString() === messageId?.toString() ? { ...m, ...updates } : m
      ),
    }));
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m._id?.toString() !== messageId?.toString()),
    }));
  },

  markMessageSeen: (messageId, seenAt) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id?.toString() === messageId?.toString() ? { ...m, seenAt } : m
      ),
    }));
  },

  setUserTyping: (userId, isTyping) => {
    // Self-cleaning typing state: auto-clear after 3.5s if stop event is missed
    if (isTyping) {
      const existingTimeout = get()[`_typingTimer_${userId}`];
      if (existingTimeout) clearTimeout(existingTimeout);
      
      const timer = setTimeout(() => {
        get().setUserTyping(userId, false);
      }, 3500);
      
      set({ [`_typingTimer_${userId}`]: timer });
    }

    set((state) => {
      const users = state.users.map((user) =>
        user._id?.toString() === userId?.toString()
          ? { ...user, isTyping }
          : user,
      );

      const selectedUser =
        state.selectedUser?._id?.toString() === userId?.toString()
          ? { ...state.selectedUser, isTyping }
          : state.selectedUser;

      return { users, selectedUser };
    });
  },

  clearUserTyping: () => {
    set((state) => ({
      users: state.users.map((user) => ({ ...user, isTyping: false })),
      selectedUser: state.selectedUser ? { ...state.selectedUser, isTyping: false } : null,
    }));
  },

  addContact: (userId) =>
    set((state) => ({
      contactList: state.contactList.includes(userId)
        ? state.contactList
        : [...state.contactList, userId],
    })),

  removeContact: (userId) =>
    set((state) => ({
      contactList: state.contactList.filter(
        (id) => id.toString() !== userId.toString(),
      ),
    })),

  renameContact: (userId, alias) =>
    set((state) => ({
      contactAliases: { ...state.contactAliases, [userId.toString()]: alias },
    })),

  setContactList: (contactList) => set({ contactList }),

  setSelectedUser: (user) => {
    if (!user) {
      set({ selectedUser: null, selectedConversationId: null, selectedConversationType: null });
      return;
    }
    
    // Resolve the real _id from the existing users list if possible
    // This handles cases where 'user' might be an ID string (real or obfuscated) or an object
    const users = get().users;
    const targetId = (user._id || user.id || user).toString();
    const resolvedUser = users.find(u => u._id === targetId || u.id === targetId);
    
    const realId = resolvedUser?._id || user._id || (targetId.startsWith("orb_") ? null : targetId);
    
    set({ 
      selectedUser: resolvedUser || (typeof user === 'object' ? user : null),
      selectedConversationId: realId ? realId.toString() : targetId,
      selectedConversationType: "direct"
    });
  },

  markSeen: (conversationId) => {
    const { socket } = useAuthStore.getState();
    if (!socket || !conversationId) return;

    // Find latest message from the other user to mark as seen
    const { messages } = get();
    const lastMsgFromOther = [...messages].reverse().find(m => 
      m.senderId?._id?.toString() === conversationId.toString() || 
      m.senderId?.toString() === conversationId.toString()
    );

    if (lastMsgFromOther) {
      socket.emit("seen", {
        messageId: lastMsgFromOther._id,
        conversationId,
        conversationType: "direct"
      });
    }
  }
}));
