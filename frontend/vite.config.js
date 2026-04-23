import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-zustand': ['zustand'],
          'vendor-socket': ['socket.io-client'],
          'vendor-motion': ['framer-motion'],
          'vendor-three': ['three', '@react-three/fiber', '@react-spring/three'],
          'vendor-utils': ['axios', 'lucide-react', 'react-hot-toast', 'react-intersection-observer', 'react-virtuoso'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
