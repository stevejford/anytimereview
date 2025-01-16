import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  preview: {
    port: 5173,
    host: true,
    strictPort: true,
  },
});