import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { getSocket } from "../lib/socket";

export const useContactStore = create((set, get) => ({
  pendingRequests: [],
  searchResults: [],
  isLoading: false,

  fetchPendingRequests: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get("/api/contacts/pending");
      set({ pendingRequests: res.data });
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
    } finally {
      set({ isLoading: false });
    }
  },

  searchContacts: async (query) => {
    if (!query || query.length < 3) {
      set({ searchResults: [] });
      return;
    }
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get(`/api/contacts/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      set({ isLoading: false });
    }
  },

  sendRequest: async (receiverId) => {
    try {
      await axiosInstance.post("/api/contacts/request", { receiverId });
      // Can update local state to show 'request sent'
    } catch (err) {
      console.error("Send request failed", err);
      throw err;
    }
  },

  acceptRequest: async (requestId, senderId) => {
    try {
      await axiosInstance.post("/api/contacts/accept", { requestId });
      set(state => ({
        pendingRequests: state.pendingRequests.filter(req => req._id !== requestId)
      }));
    } catch (err) {
      console.error("Accept request failed", err);
      throw err;
    }
  },

  declineRequest: async (requestId) => {
    try {
      await axiosInstance.post("/api/contacts/decline", { requestId });
      set(state => ({
        pendingRequests: state.pendingRequests.filter(req => req._id !== requestId)
      }));
    } catch (err) {
      console.error("Decline request failed", err);
      throw err;
    }
  },

  addPendingRequest: (requestData) => {
    set(state => ({
      pendingRequests: [requestData, ...state.pendingRequests]
    }));
  }
}));
