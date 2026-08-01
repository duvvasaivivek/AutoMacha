import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // We will manually prompt for updates
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      includeAssets: [
        'favicon.svg',
        'pwa-72x72.png',
        'pwa-96x96.png',
        'pwa-128x128.png',
        'pwa-144x144.png',
        'pwa-152x152.png',
        'pwa-192x192.png',
        'pwa-384x384.png',
        'pwa-512x512.png',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        name: 'AutoMacha – Campus Ride Share',
        short_name: 'AutoMacha',
        description: 'The official campus travel companion for IIITDM Kurnool students. Match auto rides, split fares, and communicate securely.',
        theme_color: '#863BFF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['travel', 'navigation'],
        icons: [
          { src: 'pwa-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: 'pwa-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'pwa-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'pwa-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('zod') || id.includes('axios') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})
