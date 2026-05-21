import { useAuthStore } from "./useAuthStore.js";
import { useChatStore } from "./useChatStore.js";
import { useNexusStore } from "./useNexusStore.js";

/**
 * Initializes global store subscriptions to handle cross-store dependencies
 * without causing circular imports or tight coupling.
 */
export const initStoreSubscriptions = () => {
  // Clear chat and nexus states when user logs out
  useAuthStore.subscribe(
    (state) => state.authUser,
    (authUser, previousUser) => {
      // If we had a user and now we don't (logout)
      if (previousUser && !authUser) {
        const clearChat = useChatStore.getState().clearStore;
        if (clearChat) clearChat();
        
        // Manual clearing if clearStore doesn't exist yet
        useChatStore.setState({
          users: [],
          selectedUser: null,
          messages: [],
          messageCache: {},
          isUsersLoading: false,
          isMessagesLoading: false,
          unreadCounts: {},
          typingUsers: [],
          hasMoreMessages: true,
          selectedConversationId: null,
        });

        useNexusStore.setState({
          nexuses: [],
          selectedNexus: null,
          selectedNexusId: null,
          nexusMessages: [],
          nexusUnread: {},
          nexusTypingUsers: [],
          hasMoreNexusMessages: true,
          isNexusesLoading: false,
          isMessagesLoading: false,
          nexusActionView: null,
        });
      }
    }
  );
};
