import { useState, useEffect } from 'react';

export function useDevicePerformance() {
  const [perfMode, setPerfMode] = useState('high'); // 'high', 'low'

  useEffect(() => {
    let mode = 'high';

    // 1. Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      mode = 'low';
    }

    // 2. Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      mode = 'low';
    }

    // 3. Check device memory (RAM in GB)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      mode = 'low';
    }

    setPerfMode(mode);

    // Apply class to document for global CSS overrides
    if (mode === 'low') {
      document.documentElement.classList.add('perf-low');
    } else {
      document.documentElement.classList.remove('perf-low');
    }

    return () => {
      document.documentElement.classList.remove('perf-low');
    };
  }, []);

  return {
    perfMode,
    isLowEnd: perfMode === 'low',
    isHighEnd: perfMode === 'high'
  };
}
