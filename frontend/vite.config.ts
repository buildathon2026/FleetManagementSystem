import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ask': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/health': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/feedback': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8001'),
  },
})
