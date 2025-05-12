import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@api': path.resolve(__dirname, './src/api'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:8009',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Опции для уменьшения размера сборки
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Оставляем консоль для отладки
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
  base: './',
  // Настройка envDir чтобы Vite правильно находил файлы .env
  envDir: '.',
  // Настройка environment variables
  define: {
    // Явно определяем переменные окружения, чтобы они были доступны в приложении
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://iot-app.beeline.kz'),
  }
}) 