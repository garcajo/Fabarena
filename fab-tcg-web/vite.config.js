import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite Configuration for FAB Arena
 * 
 * Production: Deployed to Vercel
 * Development: Local with API proxy
 */
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
    //   manifest: {
    //     name: 'FabArena',
    //     short_name: 'FabArena',
    //     description: 'FabArena - The best FAB TCG Companion App',
    //     theme_color: '#C52222',
    //     background_color: '#1a1a1a',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // })
  ],
  // Proxy only in development - in production, VITE_API_URL points to backend
  // Proxy config removed as backend is deprecated in favor of direct Supabase connection + Serverless functions
  // Use 'vercel dev' to test serverless functions locally
  server: mode === 'development' ? {
    // No proxy needed for Supabase. 
    // API routes for scraping are served by Vercel Dev.
  } : undefined,
  build: {
    // Optimize for production (Disabled for debugging)
    minify: false, // WAS: 'terser'
    sourcemap: true, // WAS: false
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
}))
