import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// PWA Manifest
const pwaManifest = {
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
    // PWA manifest and meta tags injection
    {
      name: 'pwa-assets',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `
          <link rel="manifest" href="/starter-project-with-vite/manifest.json" />
          <link rel="icon" type="image/png" sizes="192x192" href="/starter-project-with-vite/icon-192x192.png">
          <link rel="apple-touch-icon" href="/starter-project-with-vite/icon-192x192.png">
          <meta name="theme-color" content="#4f46e5">
          <meta name="mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
          <meta name="apple-mobile-web-app-title" content="Stories">
          <meta name="description" content="Aplikasi berbagi cerita">
          </head>`
        );
      }
    },
    // Service Worker headers
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          if (_req.url === '/sw.js' || _req.url === '/starter-project-with-vite/sw.js') {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Service-Worker-Allowed', '/');
            res.setHeader('Cache-Control', 'no-cache');
          }
          // Ensure proper MIME type for PWA files
          if (_req.url.endsWith('.webmanifest') || _req.url.endsWith('manifest.json')) {
            res.setHeader('Content-Type', 'application/manifest+json');
          }
          next();
        });
      },
      // Also handle production build
      apply: 'serve',
    },
  ],
  // Ensure proper base URL handling in development
  server: {
    port: 5173,
    strictPort: true,
    open: '/starter-project-with-vite/',
    fs: {
      strict: false
    },
    proxy: {
      // Add any API proxies if needed
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
});
