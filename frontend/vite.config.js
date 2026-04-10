import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5005';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'GreenLeaf Eco-Commerce',
          short_name: 'GreenLeaf',
          description: 'Ultra-fast eco-friendly delivery',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],

    // ✅ Development server (local)
    server: {
      host: '0.0.0.0',
      port: 5173,
      headers: {
        // Fix for Google OAuth popup issue
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
      },
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
        },
        '/socket.io': {
          target: backendUrl,
          changeOrigin: true,
          ws: true
        }
      }
    },

    // ✅ Production preview (Render fix)
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: 'all'   // 🔥 fixes "Blocked request" error
    },

    // ✅ Build settings
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
