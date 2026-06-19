import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ask': {
        target: 'http://192.168.1.160:8001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/health': {
        target: 'http://192.168.1.160:8001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/feedback': {
        target: 'http://192.168.1.160:8001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
