import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@microsoft/signalr')) return 'vendor-signalr';
            if (id.includes('lucide-react') || id.includes('@hello-pangea/dnd')) return 'vendor-ui';
            if (id.includes('@tanstack') || id.includes('axios') || id.includes('zustand')) return 'vendor-data';
            return 'vendor-core';
          }
        },
      },
    },
  },
})
