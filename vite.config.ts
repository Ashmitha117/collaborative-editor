import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@codemirror/lang-')) {
              return 'codemirror-langs';
            }
            if (id.includes('@codemirror') || id.includes('codemirror') || id.includes('y-codemirror.next')) {
              return 'codemirror-core';
            }
            if (id.includes('yjs') || id.includes('y-websocket') || id.includes('lib0')) {
              return 'yjs-vendor';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})