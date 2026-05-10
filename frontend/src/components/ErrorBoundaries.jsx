import React from 'react';

export class ChatContainerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Chat Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-base-300/20 backdrop-blur-md rounded-xl border border-white/10">
          <h2 className="text-xl font-bold mb-2">Chat unavailable</h2>
          <p className="text-sm opacity-60 mb-4">The chat frequency encountered a fatal anomaly.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-sm"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export class SidebarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-xs text-error opacity-70">
          Failed to load sidebar
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export class MessageBubbleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-2 border border-dashed border-error/50 rounded-lg text-xs italic">
          Message failed to load
        </div>
      );
    }
    return this.props.children;
  }
}

export class StoreProviderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white p-6">
          <h1 className="text-2xl font-black mb-4 tracking-tighter">Application Error</h1>
          <p className="text-center opacity-70 max-w-md mb-8">
            The local state store has collapsed.
          </p>
          <div className="flex gap-4">
             <button onClick={() => window.location.reload()}>Retry</button>
             <button onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
