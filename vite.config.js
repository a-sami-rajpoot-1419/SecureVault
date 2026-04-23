import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info',
  plugins: [
    react(),
  ],
  server: {
    port: 5173,
    open: true, // Auto-open browser
    host: true, // Allow access from network
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});