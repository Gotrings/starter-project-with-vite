import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';

// Get the directory name in ES module
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// PWA configuration
const pwaOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
  manifest: {
    name: 'Stories App',
    short_name: 'Stories',
    description: 'Aplikasi berbagi cerita',
    theme_color: '#4f46e5',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /^https?:\/\/unpkg\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'unpkg-cdn-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      }
    ]
  },
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: 'index.html'
  }
};

export default defineConfig({
  root: resolve(__dirname, 'src'),
  base: '/starter-project-with-vite/',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        sw: resolve(__dirname, 'public/sw.js')
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: '/starter-project-with-vite/',
    fs: {
      strict: false
    },
    proxy: {
      // Add any API proxies if needed
    }
  },
  plugins: [
    VitePWA(pwaOptions),
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          if (_req.url === '/sw.js') {
            res.setHeader('Content-Type', 'application/javascript');
          }
          next();
        });
      },
    },
  ],
});
