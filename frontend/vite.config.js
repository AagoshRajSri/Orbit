import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['mlkem'],
  },
  build: {
    rollupOptions: {
      output: {
        // Function form guarantees every module path is isolated into the
        // correct chunk — prevents lucide-react icons from bleeding into
        // theme chunks during tree-shaking (which caused TDZ crashes).
        manualChunks(id) {
          // ── Crypto / WASM ──────────────────────────────────────────
          if (id.includes('mlkem')) return 'vendor-crypto';

          // ── Three.js / R3F ─────────────────────────────────────────
          if (id.includes('@react-three') || id.includes('three')) return 'vendor-three';

          // ── Framer Motion ──────────────────────────────────────────
          if (id.includes('framer-motion')) return 'vendor-motion';

          // ── Icons — isolated chunk so minified names never collide ─
          if (id.includes('lucide-react')) return 'vendor-icons';

          // ── Socket ─────────────────────────────────────────────────
          if (id.includes('socket.io-client')) return 'vendor-socket';

          // ── Zustand ────────────────────────────────────────────────
          if (id.includes('zustand')) return 'vendor-zustand';

          // ── React core ─────────────────────────────────────────────
          if (id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
          if (id.includes('/node_modules/react/')) return 'vendor-react';

          // ── Remaining node_modules go to vendor-utils ──────────────
          if (id.includes('node_modules')) return 'vendor-utils';
        },
      },
      onwarn(warning, warn) {
        // mlkem WASM warnings are expected — suppress to avoid noise
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.exporter?.includes('mlkem')) return;
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
