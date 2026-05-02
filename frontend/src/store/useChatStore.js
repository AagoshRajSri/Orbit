import { create } from "zustand";
import toast from "../lib/toast";
import { axiosInstance } from "../lib/axios.jsx";
import { useAuthStore } from "./useAuthStore";

import toast from "../lib/toast";

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
        users: users,
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
    set({ isMessagesLoading: true, messages: [], hasMoreMessages: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      set({ 
        messages: res.data, 
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
      
      set((state) => ({ 
        messages: [...res.data, ...state.messages],
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
      addMessage(optimisticMessage);

      const res = await axiosInstance.post(`/message/send/${userId}`, { 
        text, 
        image, 
        idempotencyKey 
      });

      // Status update is inherently handled by Socket.IO resolving the identical idempotencyKey
      // or we can manually flip state. We'll rely on the backend response.
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

    try {
      await axiosInstance.post(`/message/send/${targetId}`, {
        text: msg.text,
        image: msg.image,
        idempotencyKey: msg.idempotencyKey
      });
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

  addMessage: (message) => {
    set((state) => {
      const normalizeId = (id) => {
        if (!id) return null;
        if (typeof id === 'object' && id._id) return id._id.toString();
        return id.toString();
      };
      
      const currentSelectedId = state.selectedConversationId 
        ? normalizeId(state.selectedConversationId) 
        : (state.selectedUser?._id ? normalizeId(state.selectedUser._id) : null);
        
      const senderId = normalizeId(message.senderId);
      const receiverId = normalizeId(message.receiverId);
      
      // The message belongs to current chat if we are talking to the sender OR the receiver
      const belongsToCurrentChat = 
        currentSelectedId === senderId || currentSelectedId === receiverId;
      
      let newMessages = [...state.messages];
      let users = [...state.users];
      
      if (belongsToCurrentChat) {
          const messageId = normalizeId(message._id);
          const idempotencyKey = message.idempotencyKey;
          
          const existsIndex = newMessages.findIndex((m) => {
             const mId = normalizeId(m._id);
             if (mId && messageId && mId === messageId) return true;
             if (m.idempotencyKey && idempotencyKey && m.idempotencyKey === idempotencyKey) return true;
             return false;
          });
          
          if (existsIndex === -1) {
              newMessages.push(message);
          } else {
              newMessages[existsIndex] = { ...newMessages[existsIndex], ...message, status: "sent" };
          }
          
          newMessages.sort((a, b) => {
             const timeA = new Date(a.createdAt || 0).getTime();
             const timeB = new Date(b.createdAt || 0).getTime();
             return timeA - timeB;
          });
      }

      // Update the user list (for last message preview / unread dot)
      users = users.map((user) => {
          const uId = normalizeId(user._id);
          if (uId === senderId) {
              return {
                 ...user,
                 lastMessage: "New message",
                 unreadCount: !belongsToCurrentChat ? (user.unreadCount || 0) + 1 : 0
              };
          }
          if (uId === receiverId) {
             return { ...user, lastMessage: "You sent a message" };
          }
          return user;
      });

      return { messages: newMessages, users };
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

  setSelectedUser: (user) => set({ 
    selectedUser: user,
    selectedConversationId: user?._id || null,
    selectedConversationType: user ? "direct" : null
  }),
}));
