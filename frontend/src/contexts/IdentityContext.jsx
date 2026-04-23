import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useAuthStore } from "../store/useAuthStore";

/**
 * IDENTITY CONTEXT
 *
 * Single source of truth for authenticated user identity.
 * Ensures username, userId, and auth state are ALWAYS consistent across app.
 *
 * Rules:
 * - One context, no prop drilling
 * - Derived from auth store (shared state)
 * - Subscribes all children automatically
 * - Invalidation on logout
 */

const IdentityContext = createContext(null);

/**
 * IDENTITY STATE STRUCTURE
 */
const DEFAULT_IDENTITY = {
  // User IDs & Auth
  userId: null,
  username: null,
  email: null,

  // Visual & Profile
  profilePic: null,
  bio: null,

  // Authentication
  authToken: null,
  constellationHash: null,

  // Session
  sessionId: null,
  isAuthenticated: false,
  isCheckingAuth: true,
};

/**
 * PROVIDER COMPONENT
 * Wraps app and provides identity to all children
 */
export function IdentityProvider({ children }) {
  const authUser = useAuthStore((state) => state.authUser);
  const sessionId = useAuthStore((state) => state.sessionId);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  // Build identity object from auth state
  const identity = useCallback(() => {
    if (!authUser) {
      return DEFAULT_IDENTITY;
    }

    return {
      userId: authUser._id,
      username: authUser.username,
      email: authUser.email,
      profilePic: authUser.profilePic,
      bio: authUser.bio,
      authToken: authUser.authToken,
      constellationHash: authUser.constellationHash,
      sessionId: sessionId || null,
      isAuthenticated: !!authUser._id,
      isCheckingAuth,
    };
  }, [authUser, sessionId, isCheckingAuth]);

  const value = identity();

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

/**
 * HOOK: useIdentity
 * Access the identity context from any component
 *
 * Usage:
 * const { username, userId, isAuthenticated } = useIdentity();
 */
export function useIdentity() {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }

  return context;
}

/**
 * HOOK: useIsAuthenticated
 * Quick check: is user logged in?
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isCheckingAuth } = useIdentity();
  return { isAuthenticated, isCheckingAuth };
}

/**
 * HOOK: useUsername
 * Get current username - GUARANTEED consistent across app
 */
export function useUsername() {
  const { username } = useIdentity();
  return username;
}

/**
 * HOOK: useUserId
 * Get current user ID - GUARANTEED consistent across app
 */
export function useUserId() {
  const { userId } = useIdentity();
  return userId;
}

export default IdentityContext;
