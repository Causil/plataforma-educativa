/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
