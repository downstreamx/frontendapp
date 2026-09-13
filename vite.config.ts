import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@inertiajs/react': path.resolve(__dirname, './src/shims/inertia-react.tsx'),
    },
  },
  optimizeDeps: {
    include: ['unicode-emoji-json/data-by-emoji.json'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
