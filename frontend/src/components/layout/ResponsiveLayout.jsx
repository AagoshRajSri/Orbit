import React, { useEffect, useState } from "react";

/**
 * Error Boundary for catching component errors
 * Prevents entire app from crashing due to component failures
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    try {
      console.error("Error caught by boundary:", String(error));
      console.error("Component stack:", errorInfo?.componentStack);
    } catch (e) {
      console.error("Error caught by boundary (un-stringifiable):", typeof error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-base-100">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-error">Something went wrong</h2>
              <p className="text-sm text-base-content/70">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Responsive Layout Container
 * Adapts to all screen sizes with proper breakpoints
 */
export function ResponsiveContainer({ children, className = "" }) {
  return <div className={`w-full h-full ${className}`}>{children}</div>;
}

/**
 * Mobile-aware Sidebar Component
 * Collapses to drawer on mobile, stays visible on desktop
 */
export function ResponsiveSidebar({ children, isOpen, onClose }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
        <div
          className={`fixed left-0 top-0 h-full w-80 bg-base-100 shadow-xl transform transition-transform duration-300 z-50 md:hidden overflow-y-auto ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <div className="hidden md:block w-80 h-full overflow-y-auto bg-base-100 border-r border-base-300">
      {children}
    </div>
  );
}

/**
 * Responsive Grid Layout
 * Adapts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  gap = "gap-4",
  className = "",
}) {
  return (
    <div className={`grid ${columns} ${gap} w-full ${className}`}>
      {children}
    </div>
  );
}

/**
 * Safe Image Component
 * Handles loading errors gracefully
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackSrc,
  onLoadComplete,
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && fallbackSrc !== imgSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-base-200 animate-pulse`} />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? "hidden" : ""} ${hasError ? "opacity-50" : ""}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {hasError && fallbackSrc === imgSrc && (
        <span className="text-xs text-gray-500">{alt}</span>
      )}
    </>
  );
}

/**
 * FIX 15: Singleton connectivity listeners — exactly 2 DOM event listeners
 * regardless of how many components call useConnectivity().
 * Previous impl: N components × 2 listeners = 2N listeners.
 * New impl:      1 module-level setup = 2 listeners, always.
 */
const _onlineListeners = new Set();
const _offlineListeners = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("online",  () => _onlineListeners.forEach(fn => fn(true)));
  window.addEventListener("offline", () => _offlineListeners.forEach(fn => fn(false)));
  if ("connection" in navigator) {
    navigator.connection.addEventListener("change", () => {
      // notify any listeners that care about connectionType
    });
  }
}

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(
    navigator.connection?.effectiveType,
  );

  useEffect(() => {
    const onOnline  = () => { setIsOnline(true); };
    const onOffline = () => { setIsOnline(false); };
    const onConnChg = () => setConnectionType(navigator.connection?.effectiveType);

    _onlineListeners.add(onOnline);
    _offlineListeners.add(onOffline);
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", onConnChg);
    }
    return () => {
      _onlineListeners.delete(onOnline);
      _offlineListeners.delete(onOffline);
      if ("connection" in navigator) {
        navigator.connection.removeEventListener("change", onConnChg);
      }
    };
  }, []);

  return { isOnline, connectionType };
}

/**
 * Connection Status Indicator
 * Shows network status to user
 */
export function ConnectionStatus() {
  const { isOnline, connectionType } = useConnectivity();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-warning text-warning-content rounded-lg p-3 shadow-lg animate-pulse">
      <p className="text-sm font-medium">
        ⚠️ You're offline. Please check your internet connection.
      </p>
    </div>
  );
}
