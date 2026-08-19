import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Festiv',
        short_name: 'Festiv',
        description: "Planifiez, partagez et suivez vos festivals en direct.",
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // Images de festival déjà uploadées : rarement modifiées, on peut
            // servir depuis le cache en priorité une fois récupérées.
            urlPattern: ({ url }) => url.pathname.startsWith('/static/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'festiv-uploads',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        // Les appels API (festivals, lineups, positions live...) ne sont volontairement
        // pas mis en cache : cette app est temps réel (websocket), afficher des données
        // obsolètes en offline serait trompeur. Seule la coquille de l'app est précachée
        // pour permettre le lancement hors-ligne.
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
})
