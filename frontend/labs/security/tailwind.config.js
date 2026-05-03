/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        orbit: {
          bg:      '#050a0f',
          surface: '#080f1a',
          s2:      '#0c1624',
          border:  'rgba(80,140,220,0.10)',
          muted:   'rgba(110,150,210,0.50)',
          text:    'rgba(210,228,255,0.94)',
          accent:  '#3d8ff5',
          accent2: '#6eb3ff',
          success: '#0eb87a',
          danger:  '#e04848',
          warning: '#e89e2a',
        },
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'breathe': 'breathe 2s ease-in-out infinite',
        'packet': 'packet 1.4s ease-in-out infinite',
        'pip': 'pip 1.5s ease-in-out infinite',
        'ble-ring': 'bleRing 2s ease-out infinite',
      },
      keyframes: {
        breathe: {
          '0%,100%': { boxShadow: '0 0 0 1px rgba(61,143,245,0.08), 0 0 30px rgba(61,143,245,0.06)' },
          '50%':     { boxShadow: '0 0 0 1px rgba(61,143,245,0.18), 0 0 55px rgba(61,143,245,0.13)' },
        },
        packet: {
          '0%':   { left: '0%',              opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { left: 'calc(100% - 8px)', opacity: '0' },
        },
        pip: {
          '0%,100%': { opacity: '0.4' },
          '50%':     { opacity: '1'   },
        },
        bleRing: {
          '0%':   { opacity: '0.8', transform: 'scale(0.3)', borderColor: 'rgba(61,143,245,0.7)' },
          '100%': { opacity: '0',   transform: 'scale(1)',   borderColor: 'rgba(61,143,245,0)'   },
        },
      },
    },
  },
  plugins: [],
}
