import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ChatContainerErrorBoundary,
  SidebarErrorBoundary,
  MessageBubbleErrorBoundary,
  StoreProviderErrorBoundary
} from '../components/ErrorBoundaries';

const ErrorThrower = ({ shouldThrow = true }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Content</div>;
};

describe('ErrorBoundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatContainerErrorBoundary', () => {
    it('renders children when no error occurs', () => {
      render(
        <ChatContainerErrorBoundary>
          <div data-testid="chat-content">Chat Content</div>
        </ChatContainerErrorBoundary>
      );
      expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    });

    it('shows chat-specific error message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <ChatContainerErrorBoundary>
          <ErrorThrower />
        </ChatContainerErrorBoundary>
      );
      expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('SidebarErrorBoundary', () => {
    it('renders children when no error occurs', () => {
      render(
        <SidebarErrorBoundary>
          <div data-testid="sidebar-content">Sidebar Content</div>
        </SidebarErrorBoundary>
      );
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    });

    it('shows sidebar-specific error message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <SidebarErrorBoundary>
          <ErrorThrower />
        </SidebarErrorBoundary>
      );
      expect(screen.getByText('Failed to load sidebar')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('MessageBubbleErrorBoundary', () => {
    it('renders children when no error occurs', () => {
      render(
        <MessageBubbleErrorBoundary>
          <div data-testid="bubble-content">Bubble Content</div>
        </MessageBubbleErrorBoundary>
      );
      expect(screen.getByTestId('bubble-content')).toBeInTheDocument();
    });

    it('shows message error fallback', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <MessageBubbleErrorBoundary>
          <ErrorThrower />
        </MessageBubbleErrorBoundary>
      );
      expect(screen.getByText('Message failed to load')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  describe('StoreProviderErrorBoundary', () => {
    it('renders children when no error occurs', () => {
      render(
        <StoreProviderErrorBoundary>
          <div data-testid="store-content">Store Content</div>
        </StoreProviderErrorBoundary>
      );
      expect(screen.getByTestId('store-content')).toBeInTheDocument();
    });

    it('shows application error message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <StoreProviderErrorBoundary>
          <ErrorThrower />
        </StoreProviderErrorBoundary>
      );
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText(/Retry/)).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });
});
