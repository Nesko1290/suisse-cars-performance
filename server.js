// Production Node.js server for Suisse Cars Performance
// Serves the built static site from ./dist
// Compatible with: Hostinger Node, Render, Fly.io, Heroku, Railway, etc.
//
// Usage:
//   npm run build && npm start
//   PORT=8080 npm start
//
// The host platform sets process.env.PORT — we honor it.

import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = resolve(__dirname, 'dist');
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (!existsSync(DIST_DIR)) {
  console.error('\n[server] dist/ directory not found.');
  console.error('[server] Run `npm run build` first, then `npm start`.\n');
  process.exit(1);
}

const app = express();

// Trust the platform proxy (Render, Fly, Hostinger all sit behind one)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// gzip everything
app.use(compression());

// Static assets — long cache for /assets/* (Vite hashes them), no-cache for HTML
app.use(
  express.static(DIST_DIR, {
    extensions: ['html'],
    setHeaders(res, path) {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else if (path.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

// Health check for platform monitors
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// 404 fallback — try to serve a friendly 404, otherwise plain text
app.use((req, res) => {
  const notFound = join(DIST_DIR, '404.html');
  if (existsSync(notFound)) {
    res.status(404).sendFile(notFound);
  } else {
    res.status(404).type('text/plain').send('404 — page introuvable');
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`\n[server] Suisse Cars Performance — listening on http://${HOST}:${PORT}`);
  console.log(`[server] Serving:  ${DIST_DIR}\n`);
});

// Graceful shutdown for hosts that send SIGTERM
const shutdown = (signal) => {
  console.log(`\n[server] ${signal} received — shutting down…`);
  server.close(() => {
    console.log('[server] closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
