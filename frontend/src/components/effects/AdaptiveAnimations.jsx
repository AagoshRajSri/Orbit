import { motion, AnimatePresence } from "framer-motion";
import React, { useMemo } from "react";
import { performanceDetector } from "../../lib/performanceDetection";

/**
 * Adaptive Motion Component
 * Automatically adjusts animation complexity based on device capability
 */
export const AdaptiveMotion = ({
  children,
  initial,
  animate,
  exit,
  transition,
  className,
  skipAnimationIfReduced = true,
}) => {
  const profile = performanceDetector.detect();
  const shouldReduceAnimations =
    skipAnimationIfReduced && profile.reducedMotion;

  if (shouldReduceAnimations) {
    // For reduced motion: return without animation wrapper
    return <div className={className}>{children}</div>;
  }

  // Get animated version based on performance tier
  const animationConfig = performanceDetector.getAnimationConfig({
    transition,
  });

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={animationConfig.transition || transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Optimized Spring Animation
 * Uses appropriate stiffness/damping based on device
 */
export const OptimizedSpring = ({
  children,
  delay = 0,
  className,
  onComplete,
}) => {
  const profile = performanceDetector.detect();
  const shouldReduceAnimations = profile.reducedMotion;

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  let stiffness, damping, mass;

  switch (profile.tier) {
    case "high":
      stiffness = 100;
      damping = 15;
      mass = 1;
      break;
    case "medium":
      stiffness = 80;
      damping = 20;
      mass = 1.2;
      break;
    case "low":
      stiffness = 50;
      damping = 30;
      mass = 1.5;
      break;
    default:
      stiffness = 100;
      damping = 15;
      mass = 1;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness,
        damping,
        mass,
        delay,
      }}
      className={className}
      onAnimationComplete={onComplete}
    >
      {children}
    </motion.div>
  );
};

/**
 * Optimized Fade Animation
 * Smooth fade with performance considerations
 */
export const OptimizedFade = ({
  children,
  duration = 0.3,
  delay = 0,
  className,
}) => {
  const profile = performanceDetector.detect();
  const shouldReduceAnimations = profile.reducedMotion;

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  const actualDuration =
    profile.tier === "high" ? duration : Math.min(duration, 0.15);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: actualDuration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Optimized Slide Animation
 * Adapts direction and distance based on device
 */
export const OptimizedSlide = ({
  children,
  direction = "left",
  duration = 0.4,
  delay = 0,
  distance = 20,
  className,
}) => {
  const profile = performanceDetector.detect();
  const shouldReduceAnimations = profile.reducedMotion;

  if (shouldReduceAnimations) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    left: { x: -distance, opacity: 0 },
    right: { x: distance, opacity: 0 },
    up: { y: distance, opacity: 0 },
    down: { y: -distance, opacity: 0 },
  };

  const actualDuration =
    profile.tier === "high" ? duration : Math.min(duration, 0.2);

  return (
    <motion.div
      initial={variants[direction] || variants.left}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={variants[direction] || variants.left}
      transition={{
        duration: actualDuration,
        delay,
        ease: profile.tier === "high" ? "easeOut" : "linear",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated Presence Wrapper
 * Handles mount/unmount animations efficiently
 */
export const OptimizedAnimatePresence = ({ children, mode = "wait" }) => {
  const profile = performanceDetector.detect();

  if (profile.reducedMotion) {
    // Return children without animation wrapper
    return <>{children}</>;
  }

  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
};

/**
 * Hover Animation (No interaction on low-end devices)
 */
export const OptimizedHover = ({ children, scaleAmount = 1.05, className }) => {
  const profile = performanceDetector.detect();

  if (profile.tier === "low" || profile.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ scale: scaleAmount }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Skeleton Loading Component
 * Shows placeholder while content loads with appropriate animation
 */
export const OptimizedSkeleton = ({
  width = "w-full",
  height = "h-4",
  className = "",
  count = 1,
}) => {
  const profile = performanceDetector.detect();
  const shouldPulse = profile.tier !== "low";

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${width} ${height} bg-base-300 rounded ${shouldPulse ? "animate-pulse" : ""} ${className}`}
        />
      ))}
    </>
  );
};

/**
 * Performance Monitor Component (Development only)
 * Shows current performance profile and metrics
 */
export const PerformanceMonitor = () => {
  if (import.meta.env.PROD) return null;

  const profile = performanceDetector.detect();

  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-2 text-xs rounded-tl font-mono max-w-xs z-50">
      <div className="text-yellow-400 font-bold">Performance Profile</div>
      <div>
        Tier:{" "}
        <span className="text-cyan-400">{profile.tier.toUpperCase()}</span>
      </div>
      <div>CPU Cores: {profile.cpuCores}</div>
      <div>Memory: {profile.memory}GB</div>
      <div>Network: {profile.effectiveType}</div>
      <div>WebGL: {profile.supportsWebGL ? "✓" : "✗"}</div>
      <div>FPS: {profile.screenRefreshRate}</div>
      <div>Reduced Motion: {profile.reducedMotion ? "✓" : "✗"}</div>
      <div>Low Battery: {profile.lowBattery ? "✓" : "✗"}</div>
    </div>
  );
};
