import React, { Component } from "react";

/**
 * Error boundary for the chat container view.
 */
export class ChatContainerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ChatContainerErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg text-center max-w-md mx-auto my-4 border border-base-300 shadow-sm">
          <p className="text-error font-medium mb-4">Chat unavailable</p>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Error boundary for the sidebar view.
 */
export class SidebarErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SidebarErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-base-200/50 text-center h-full border border-base-300">
          <p className="text-error text-sm font-medium mb-3">Failed to load sidebar</p>
          <button 
            className="btn btn-xs btn-outline btn-error"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Error boundary for individual message bubbles.
 */
export class MessageBubbleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MessageBubbleErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-2.5 bg-error/10 border border-error/20 text-error text-xs rounded-lg italic">
          Message failed to load
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Global application/store provider error boundary.
 */
export class StoreProviderErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("StoreProviderErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-base-100 text-center">
          <div className="max-w-md p-8 rounded-xl bg-base-200 border border-base-300 shadow-lg">
            <h1 className="text-2xl font-bold text-error mb-4">Application Error</h1>
            <p className="text-base-content/75 mb-6">
              A critical error occurred. You can attempt to retry the operation or reload the entire page.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                className="btn btn-primary"
                onClick={() => this.setState({ hasError: false })}
              >
                Retry
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
