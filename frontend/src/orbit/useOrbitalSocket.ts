/**
 * useOrbitalSocket.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Bridges existing Socket.IO events → visual environment reactions.
 *
 * Rules:
 *  - ONLY listens to existing socket events (no new .emit calls)
 *  - Does NOT modify any Zustand store
 *  - Drives EnvironmentCanvas pulses and local state for ambient effects
 *  - Designed to be mounted ONCE near app root, alongside existing socket setup
 *
 * The existing App.jsx socket handlers (addMessage, setUserTyping, etc.)
 * run FIRST — this hook is purely additive visual enrichment.
 */

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import type { EnvironmentCanvasHandle } from './EnvironmentCanvas';

interface OrbitalSocketOptions {
  /** Ref to the EnvironmentCanvas for imperative pulse calls */
  canvasRef: React.RefObject<EnvironmentCanvasHandle | null>;
  /** Whether the user is authenticated (skip if not) */
  isAuthenticated: boolean;
}

/**
 * useOrbitalSocket
 *
 * Mounts event listeners that translate socket activity into
 * environment canvas reactions. Fully cleanup-safe.
 */
export function useOrbitalSocket({
  canvasRef,
  isAuthenticated,
}: OrbitalSocketOptions): void {
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulse = useCallback((channelId?: string) => {
    canvasRef.current?.pulse(channelId);
  }, [canvasRef]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    /** New DM arrives → brief canvas flash */
    const onNewMessage = () => {
      pulse();
    };

    /** New Nexus message → canvas pulse (slightly stronger) */
    const onNewNexusMessage = () => {
      pulse();
    };

    /**
     * User comes online → subtle environment "brightening"
     * (handled via --orb-activity CSS var updates in OrbitalThemeEngine;
     *  here we trigger a quick micro-pulse)
     */
    const onGetOnlineUsers = () => {
      // Micro pulse — environment acknowledges presence change
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => pulse(), 200);
    };

    socket.on('newMessage',      onNewMessage);
    socket.on('newNexusMessage', onNewNexusMessage);
    socket.on('getOnlineUsers',  onGetOnlineUsers);

    return () => {
      socket.off('newMessage',      onNewMessage);
      socket.off('newNexusMessage', onNewNexusMessage);
      socket.off('getOnlineUsers',  onGetOnlineUsers);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, [isAuthenticated, pulse]);
}
