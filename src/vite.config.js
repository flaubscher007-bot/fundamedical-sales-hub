import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import base44Plugin from '@base44/vite-plugin'

export default defineConfig({
  plugins: [
    base44Plugin(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Force a single copy of React across ALL packages (prevents "Invalid hook call" errors)
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-leaflet', 'leaflet'],
  },
  optimizeDeps: {
    // Pre-bundle and deduplicate React so no package can sneak in its own copy
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true,
  },
})