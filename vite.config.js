import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend during development
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/process-document': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/analyze-bills': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
