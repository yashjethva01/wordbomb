import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router-dom') || id.includes('@remix-run/router')) {
            return 'router';
          }

          if (id.includes('socket.io-client') || id.includes('engine.io-client') || id.includes('socket.io-parser')) {
            return 'realtime';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
