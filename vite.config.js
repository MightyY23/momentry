import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) expects a function form.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (
            id.includes('react') ||
            id.includes('scheduler')
          ) {
            return 'react';
          }

          if (
            id.includes('framer-motion') ||
            id.includes('lucide-react')
          ) {
            return 'ui';
          }

          if (id.includes('leaflet')) {
            return 'maps';
          }

          // Supabase (auth/db/realtime/storage)
          // is its own cacheable chunk.
          if (id.includes('@supabase')) {
            return 'supabase';
          }

          // Charts are only used by the lazy
          // Analytics page — keep them out of
          // the eagerly-loaded vendor chunk.
          if (
            id.includes('recharts') ||
            id.includes('d3-') ||
            id.includes('victory-vendor')
          ) {
            return 'charts';
          }

          if (id.includes('jspdf')) {
            return 'pdf';
          }

          return 'vendor';
        },
      },
    },
  },
})
