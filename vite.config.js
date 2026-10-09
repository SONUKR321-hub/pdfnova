import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/pdfnova/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist', 'file-saver', 'signature_pad'],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'pdfjs': ['pdfjs-dist'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand', 'framer-motion'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
