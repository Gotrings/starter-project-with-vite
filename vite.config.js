import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/starter-project-with-vite/', // <-- tambahkan ini
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    middlewareMode: false,
    fs: {
      strict: false
    }
  },
  plugins: [
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
