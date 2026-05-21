import { create } from "zustand";
import toast from "../lib/toast";
import { axiosInstance } from "../lib/axios.jsx";
import { useAuthStore } from "./useAuthStore";
import { normalizeId, isMatchObj } from "../lib/idUtils";

import { e2eeService } from "../lib/E2EEService";

const decryptMessagesList = async (messages) => {
  if (!messages || !messages.length) return messages;
  return Promise.all(messages.map((m) => e2eeService.decryptIncoming(m)));
};

const prefetchCache = new Set();
const prefetchExpirations = new Map();

export const useChatStore = create((set, get) => ({
  messages: [],
  messageCache: {}, // { [userId]: { messages, hasMore } }
  hasMoreMessages: true,
  users: [],
  contactList: [],
  contactRequests: [],
  sentRequests: [],
  blockedContacts: [],
  contactAliases: {},
  isUsersLoading: false,
  isMessagesLoading: false,
  isLoadingMoreParams: false,
  selectedUser: null,
  selectedConversationId: null, // Tracked for component synchronization
  selectedConversationType: null, // "direct" or "nexus" (though only "direct" here)

  getUsers: async () => {
    const authStore = useAuthStore.getState();
    if (!authStore.authUser || authStore.isCheckingAuth) return;
    set({ isUsersLoading: true });
    try {
      // 1. Fetch contacts list and aliases from the database
      const contactsRes = await axiosInstance.get("/auth/contacts");
      const dbContacts = contactsRes.data.contacts || [];
      const dbContactRequests = contactsRes.data.contactRequests || [];
      const dbSentRequests = contactsRes.data.sentRequests || [];
      const dbBlockedContacts = contactsRes.data.blockedContacts || [];
      const dbContactIds = contactsRes.data.contactIds || [];
      const dbAliases = contactsRes.data.aliases || {};

      // 2. Fetch sidebar/all users
      const res = await axiosInstance.get("/message/users");
      const allUsers = res.data.data || [];

      // Combine both lists to ensure any contact in db is also in state.users
      const usersMap = new Map();
      allUsers.forEach(u => usersMap.set(u._id.toString(), u));
      dbContacts.forEach(u => {
        if (!usersMap.has(u._id.toString())) {
          usersMap.set(u._id.toString(), u);
        }
      });
      const combinedUsers = Array.from(usersMap.values());

      set((state) => ({
        users: combinedUsers.map(u => {
          const existing = state.users.find(eu => eu._id === u._id);
          return { ...u, unreadCount: u.unreadCount !== undefined ? u.unreadCount : (existing?.unreadCount || 0) };
        }),
        contactList: dbContactIds,
        contactRequests: dbContactRequests,
        sentRequests: dbSentRequests,
        blockedContacts: dbBlockedContacts,
        contactAliases: dbAliases,
      }));
    } catch (error) {
      console.error("[getUsers] failed:", error.message);
      // Fallback if not loaded
      try {
        const res = await axiosInstance.get("/message/users");
        const allUsers = res.data.data || [];
        set({
          users: allUsers,
          contactList: allUsers.map(u => u._id.toString()),
          contactAliases: {},
        });
      } catch (e) {
        toast.error(error.response?.data?.message || "Failed to load contacts");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    const authStore = useAuthStore.getState();
    if (!authStore.authUser || authStore.isCheckingAuth) return;
    
    if (prefetchExpirations.has(userId)) {
      clearTimeout(prefetchExpirations.get(userId));
      prefetchExpirations.delete(userId);
    }

    const currentId = get().selectedConversationId;
    const cache = get().messageCache[userId];

    // 1. Instant Cache Hit (Optimistic Load)
    if (cache) {
      set({ 
        messages: cache.messages, 
        hasMoreMessages: cache.hasMore,
        isMessagesLoading: false
      });
      // Fire background sync silently
      try {
        const res = await axiosInstance.get(`/message/${userId}`);
        const decrypted = await decryptMessagesList(res.data);
        set((state) => ({ 
          messages: currentId === userId ? decrypted : state.messages, 
          hasMoreMessages: currentId === userId ? res.data.length === 50 : state.hasMoreMessages,
          messageCache: {
            ...state.messageCache,
            [userId]: { messages: decrypted, hasMore: res.data.length === 50 }
          }
        }));
      } catch (e) {
        console.error("[Sync] Background sync failed:", e.message);
      }
      return;
    }

    // 2. Cold Start (No Cache)
    set({ isMessagesLoading: true, messages: [], hasMoreMessages: true });
    
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      const decrypted = await decryptMessagesList(res.data);
      set((state) => ({ 
        messages: decrypted, 
        hasMoreMessages: res.data.length === 50,
        messageCache: {
          ...state.messageCache,
          [userId]: { messages: decrypted, hasMore: res.data.length === 50 }
        }
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async (userId) => {
    const authStore = useAuthStore.getState();
    if (!authStore.authUser || authStore.isCheckingAuth) return;
    
    const { messages, isLoadingMoreParams, hasMoreMessages } = get();
    if (isLoadingMoreParams || !hasMoreMessages || messages.length === 0) return;

    set({ isLoadingMoreParams: true });
    try {
      const cursor = messages[0].createdAt;
      const res = await axiosInstance.get(`/message/${userId}?cursor=${cursor}`);
      const decrypted = await decryptMessagesList(res.data);
      
      set((state) => {
        const newMessages = [...decrypted, ...state.messages];
        const newHasMore = res.data.length === 50;
        return { 
          messages: newMessages,
          hasMoreMessages: newHasMore,
          messageCache: {
            ...state.messageCache,
            [userId]: { messages: newMessages, hasMore: newHasMore }
          }
        };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load older messages");
    } finally {
      set({ isLoadingMoreParams: false });
    }
  },

  prefetchMessages: async (userId) => {
    const cache = get().messageCache[userId];
    if (cache || prefetchCache.has(userId)) return; // Already cached or fetching
    
    prefetchCache.add(userId);
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      const decrypted = await decryptMessagesList(res.data);
      set((state) => ({ 
        messageCache: {
          ...state.messageCache,
          [userId]: { messages: decrypted, hasMore: res.data.length === 50 }
        }
      }));

      // Expire unused prefetches after 60 seconds
      prefetchExpirations.set(userId, setTimeout(() => {
        const state = useChatStore.getState();
        if (state.selectedConversationId !== userId) {
          useChatStore.setState((s) => {
            const newCache = { ...s.messageCache };
            delete newCache[userId];
            return { messageCache: newCache };
          });
        }
        prefetchCache.delete(userId);
        prefetchExpirations.delete(userId);
      }, 60000));
    } catch (e) {
      // Fail silently on prefetch
      prefetchCache.delete(userId);
    }
  },

  sendMessage: async (userId, text, image) => {
    const { addMessage } = get();
    const idempotencyKey = crypto.randomUUID();
    
    const authUser = useAuthStore.getState().authUser;

    const optimisticMessage = {
      _id: idempotencyKey,
      senderId: authUser,
      receiverId: { _id: userId },
      text,
      image,
      createdAt: new Date().toISOString(),
      idempotencyKey,
      status: "pending",
    };

    if (!navigator.onLine) {
      const { pushToQueue } = await import("../lib/offlineQueue.js");
      await pushToQueue({ ...optimisticMessage, targetId: userId, type: "direct" });
      addMessage(optimisticMessage);
      return optimisticMessage;
    }

    // 1. Instant optimistic UI update
    addMessage(optimisticMessage);

    // Update cache proactively
    set((state) => ({
      messageCache: {
        ...state.messageCache,
        [userId]: { 
          messages: [...(state.messageCache[userId]?.messages || []), optimisticMessage],
          hasMore: state.messageCache[userId]?.hasMore || false
        }
      }
    }));

    // 2. Fire-and-forget background encryption & send
    (async () => {
      try {
        const encryptedWire = await e2eeService.encryptOutgoing(userId, text, image, idempotencyKey);
        const res = await axiosInstance.post(`/message/send/${userId}`, {
          idempotencyKey,
          ...encryptedWire,
        });

        set((state) => ({
          messages: state.messages.map((m) =>
            m.idempotencyKey === idempotencyKey 
              ? { ...m, _id: res.data._id, status: "sent", text, image } 
              : m
          ),
        }));
      } catch (error) {
        console.error("[E2EE] Ratchet encryption/send failed:", error);
        toast.error(`Message failed: ${error.message}`);
        set((state) => ({
          messages: state.messages.map((m) =>
            m.idempotencyKey === idempotencyKey ? { ...m, status: "failed" } : m
          ),
        }));
      }
    })();

    return optimisticMessage;
  },

  syncOfflineQueue: async () => {
    if (!navigator.onLine) return;
    const { getQueue, removeFromQueue } = await import("../lib/offlineQueue.js");
    const queue = await getQueue();
    if (queue.length === 0) return;

    if (localStorage.getItem("orbit_sync_lock") === "1") return;
    localStorage.setItem("orbit_sync_lock", "1");

    try {
      for (const msg of queue) {
        if (!msg.idempotencyKey) continue;
        
        set((state) => ({
          messages: state.messages.map(m => m.idempotencyKey === msg.idempotencyKey ? { ...m, status: "sending" } : m)
        }));

        try {
          if (msg.type === "direct") {
            const targetId = (msg.targetId || msg.receiverId?._id || msg.receiverId).toString();
            const encryptedWire = await e2eeService.encryptOutgoing(targetId, msg.text, msg.image, msg.idempotencyKey);

            const res = await axiosInstance.post(`/message/send/${targetId}`, {
              idempotencyKey: msg.idempotencyKey,
              ...encryptedWire,
            });

            // Update UI status to sent and preserve plaintext
            set((state) => ({
              messages: state.messages.map((m) =>
                m.idempotencyKey === msg.idempotencyKey
                  ? { ...m, _id: res.data._id, status: "sent", text: msg.text, image: msg.image }
                  : m
              ),
            }));

          } else if (msg.type === "nexus") {
            const targetId = msg.targetId || (msg.nexusId?._id) || msg.nexusId;
            
            // Re-run the nexus encryption logic
            const { loadSenderKey, saveSenderKey } = await import("../lib/nexusKeyStore.js");
            const { senderKeyEncrypt, generateSenderKey } = await import("../lib/nexusSenderKey.js");
            const { useNexusStore: nexusStoreModule } = await import("./useNexusStore.js");
            const authUser = useAuthStore.getState().authUser;
            const senderIdStr = authUser?._id?.toString();
            
            let senderKey = await loadSenderKey(targetId, senderIdStr);
            if (!senderKey) {
              senderKey = await generateSenderKey();
              await saveSenderKey(targetId, senderIdStr, senderKey);
              await nexusStoreModule.getState().distributeNexusKey(targetId, senderKey);
            }
            
            const payload = JSON.stringify({ text: msg.text, image: msg.image });
            const { ciphertext, updatedSenderKey } = await senderKeyEncrypt(senderKey, payload);
            await saveSenderKey(targetId, senderIdStr, updatedSenderKey);
            
            const res = await axiosInstance.post(`/nexus/${targetId}/send`, {
              idempotencyKey: msg.idempotencyKey,
              ...ciphertext
            });

            // Update UI status to sent and preserve plaintext in useNexusStore
            nexusStoreModule.setState((state) => ({
              nexusMessages: state.nexusMessages.map((m) =>
                m.idempotencyKey === msg.idempotencyKey
                  ? { ...m, _id: res.data._id, status: "sent", text: msg.text, image: msg.image }
                  : m
              ),
            }));
          }
          await removeFromQueue(msg.idempotencyKey);
        } catch (err) {
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

    const authUser = useAuthStore.getState().authUser;

    // Mark as sending again
    set((s) => ({
      messages: s.messages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "sending" } : m)
    }));

    const targetId = (msg.receiverId?._id || msg.receiverId || "").toString();

    // Fire-and-forget background retry
    (async () => {
      try {
        const encryptedWire = await e2eeService.encryptOutgoing(targetId, msg.text, msg.image, idempotencyKey);
        const res = await axiosInstance.post(`/message/send/${targetId}`, {
          idempotencyKey,
          ...encryptedWire,
        });

        set((s) => ({
          messages: s.messages.map((m) =>
            m.idempotencyKey === idempotencyKey
              ? { ...m, _id: res.data._id, status: "sent", text: msg.text, image: msg.image }
              : m
          ),
        }));
      } catch (error) {
        console.error("[Retry][E2EE] Retry failed:", error);
        if (error.code === 'ERR_NETWORK') {
          const { pushToQueue } = await import("../lib/offlineQueue.js");
          await pushToQueue({ ...msg, targetId: targetId, type: "direct", status: "pending" });
          set((s) => ({
            messages: s.messages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "pending" } : m)
          }));
        } else {
          toast.error(`Retry failed: ${error.message}`);
          set((s) => ({
            messages: s.messages.map(m => m.idempotencyKey === idempotencyKey ? { ...m, status: "failed" } : m)
          }));
        }
      }
    })();
  },

  addMessage: async (message) => {
    const [decryptedMsg] = await decryptMessagesList([message]);
    
    set((state) => {
      const currentSelectedId = state.selectedConversationId
        || normalizeId(state.selectedUser);

      const msgSenderId = normalizeId(decryptedMsg.senderId);
      const msgReceiverId = normalizeId(decryptedMsg.receiverId);
      
      const belongsToCurrentChat = !!currentSelectedId && (
        currentSelectedId === msgSenderId ||
        currentSelectedId === msgReceiverId
      );
      
      let newMessages = [...state.messages];
      const cache = { ...state.messageCache };
      const authUser = useAuthStore.getState().authUser;
      const myId = authUser?._id?.toString();
      const partnerId = msgSenderId === myId ? msgReceiverId : msgSenderId;

      if (partnerId) {
        const bucket = { ...(cache[partnerId] || { messages: [], hasMore: false }) };
        const bucketMessages = [...(bucket.messages || [])];
        const msgId = decryptedMsg._id?.toString();
        const idempotencyKey = decryptedMsg.idempotencyKey;

        // Optimized deduplication using findLastIndex but with earlier exit
        const existsIndex = bucketMessages.findLastIndex((m) => {
          if (m.idempotencyKey && idempotencyKey && m.idempotencyKey === idempotencyKey) return true;
          if (m._id && msgId && m._id.toString() === msgId) return true;
          return false;
        });

        if (existsIndex === -1) {
          bucketMessages.push(decryptedMsg);
          // Only sort if timestamps are out of order (rare for append)
          if (bucketMessages.length > 1 && 
              new Date(bucketMessages[bucketMessages.length - 2].createdAt).getTime() > 
              new Date(decryptedMsg.createdAt).getTime()) {
            bucketMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
        } else {
          bucketMessages[existsIndex] = {
            ...bucketMessages[existsIndex],
            ...decryptedMsg,
            text: decryptedMsg.text || bucketMessages[existsIndex].text,
            image: decryptedMsg.image || bucketMessages[existsIndex].image,
            _id: decryptedMsg._id || bucketMessages[existsIndex]._id,
            status: "sent",
          };
        }
        bucket.messages = bucketMessages;
        cache[partnerId] = bucket;
      }

      if (belongsToCurrentChat) {
        const msgId = decryptedMsg._id?.toString();
        const idempotencyKey = decryptedMsg.idempotencyKey;

        const existsIndex = newMessages.findLastIndex((m) => {
          if (m.idempotencyKey && idempotencyKey && m.idempotencyKey === idempotencyKey) return true;
          if (m._id && msgId && m._id.toString() === msgId) return true;
          return false;
        });

        if (existsIndex === -1) {
          newMessages.push(decryptedMsg);
          if (newMessages.length > 1 && 
              new Date(newMessages[newMessages.length - 2].createdAt).getTime() > 
              new Date(decryptedMsg.createdAt).getTime()) {
            newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
        } else {
          newMessages[existsIndex] = {
            ...newMessages[existsIndex],
            ...decryptedMsg,
            text: decryptedMsg.text || newMessages[existsIndex].text,
            image: decryptedMsg.image || newMessages[existsIndex].image,
            _id: decryptedMsg._id || newMessages[existsIndex]._id,
            status: "sent",
          };
        }
      }

      // Update sidebar preview / unread badge
      const updatedUsers = state.users.map((user) => {
        const uId = user._id?.toString();
        if (uId === msgSenderId) {
          return {
            ...user,
            lastMessage: decryptedMsg.text || "Shared an image",
            unreadCount: !belongsToCurrentChat ? (user.unreadCount || 0) + 1 : 0,
          };
        }
        if (uId === msgReceiverId) {
          return { ...user, lastMessage: "You sent a message" };
        }
        return user;
      });

      return { messages: newMessages, users: updatedUsers, messageCache: cache };
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
    const uIdStr = userId?.toString();
    if (isTyping) {
      const existingTimeout = get()[`_typingTimer_${uIdStr}`];
      if (existingTimeout) clearTimeout(existingTimeout);
      
      const timer = setTimeout(() => {
        get().setUserTyping(uIdStr, false);
      }, 3500);
      
      set({ [`_typingTimer_${uIdStr}`]: timer });
    } else {
      const existingTimeout = get()[`_typingTimer_${uIdStr}`];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        set({ [`_typingTimer_${uIdStr}`]: null });
      }
    }

    set((state) => {
      const isSelected = state.selectedUser?._id?.toString() === uIdStr;
      
      const users = state.users.map((user) =>
        user._id?.toString() === uIdStr
          ? { ...user, isTyping }
          : user,
      );

      return { 
        users, 
        selectedUser: isSelected ? { ...state.selectedUser, isTyping } : state.selectedUser 
      };
    });
  },

  clearUserTyping: () => {
    // Clear all timers
    const state = get();
    Object.keys(state).forEach(key => {
      if (key.startsWith('_typingTimer_') && state[key]) {
        clearTimeout(state[key]);
      }
    });

    set((state) => ({
      users: state.users.map((user) => ({ ...user, isTyping: false })),
      selectedUser: state.selectedUser ? { ...state.selectedUser, isTyping: false } : null,
    }));
  },

  addContact: async (userIdOrUsername) => {
    try {
      const isId = userIdOrUsername.startsWith("orb_") || userIdOrUsername.length === 24;
      const payload = isId ? { contactId: userIdOrUsername } : { handle: userIdOrUsername };

      const res = await axiosInstance.post("/auth/contacts", payload);
      
      await get().getUsers(); // Refresh all contact states

      toast.success(res.data.status === "accepted" ? "Contact added" : "Contact request sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add contact");
      throw error;
    }
  },

  acceptContactRequest: async (userId) => {
    try {
      await axiosInstance.post(`/auth/contacts/${userId}/accept`);
      await get().getUsers();
      toast.success("Contact request accepted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept contact request");
    }
  },

  rejectContactRequest: async (userId) => {
    try {
      await axiosInstance.post(`/auth/contacts/${userId}/reject`);
      await get().getUsers();
      toast.success("Contact request rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject contact request");
    }
  },

  removeContact: async (userId) => {
    try {
      const res = await axiosInstance.delete(`/auth/contacts/${userId}`);
      const updatedContacts = res.data.contacts || [];
      const updatedAliases = res.data.aliases || {};
      const updatedIds = updatedContacts.map(c => c._id.toString());

      set((state) => ({
        contactList: updatedIds,
        contactAliases: updatedAliases,
      }));
      toast.success("Contact removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove contact");
    }
  },

  blockContact: async (userId) => {
    try {
      await axiosInstance.post(`/auth/contacts/${userId}/block`);
      await get().getUsers();
      toast.success("Contact blocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block contact");
    }
  },

  unblockContact: async (userId) => {
    try {
      await axiosInstance.post(`/auth/contacts/${userId}/unblock`);
      await get().getUsers();
      toast.success("Contact unblocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock contact");
    }
  },

  renameContact: async (userId, alias) => {
    try {
      const res = await axiosInstance.put(`/auth/contacts/${userId}`, { alias });
      const updatedContacts = res.data.contacts || [];
      const updatedAliases = res.data.aliases || {};
      const updatedIds = updatedContacts.map(c => c._id.toString());

      set((state) => ({
        contactList: updatedIds,
        contactAliases: updatedAliases,
      }));
      toast.success("Alias updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update alias");
    }
  },

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
