/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // H3 del QA: separar librerías pesadas del bundle de la app (carga 3G)
        manualChunks: {
          katex: ['katex'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          amplify: ['aws-amplify'],
        },
      },
    },
  },
  server: {
    // Polling: evita el límite de inotify (EMFILE) cuando Kiro/IDE consumen watchers
    watch: { usePolling: true, interval: 300 },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
