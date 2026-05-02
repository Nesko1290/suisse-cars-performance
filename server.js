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
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = resolve(__dirname, 'dist');
const PUBLIC_DIR = resolve(__dirname, 'public');
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Self-build: if dist/ is missing, build it now. This makes the server
// work on any host (Hostinger, Render, Fly, etc.) regardless of whether
// they run `npm install` + `npm start` or just `node server.js`.
if (!existsSync(DIST_DIR)) {
  console.log('[server] dist/ not found — building now via vite…');
  try {
    execSync('npx --no-install vite build', { stdio: 'inherit', cwd: __dirname });
  } catch (e) {
    console.error('[server] Build failed — falling back to source files.');
    console.error(e.message);
  }
}

// Resolve which directory to serve: dist/ if it exists, else repo root
// (so individual *.html files at the root still work as a fallback).
const SERVE_DIR = existsSync(DIST_DIR) ? DIST_DIR : __dirname;
console.log('[server] serving from:', SERVE_DIR);

const app = express();

// Trust the platform proxy (Render, Fly, Hostinger all sit behind one)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// gzip everything
app.use(compression());

// Static assets — long cache for /assets/* (Vite hashes them), no-cache for HTML
const staticOpts = {
  extensions: ['html'],
  setHeaders(res, path) {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (path.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (path.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
};
app.use(express.static(SERVE_DIR, staticOpts));
// Also serve /public for anything not in dist (placeholders, vehicles.json)
if (existsSync(PUBLIC_DIR) && SERVE_DIR !== __dirname) {
  app.use(express.static(PUBLIC_DIR, staticOpts));
}

// Health check for platform monitors
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// 404 fallback — try to serve a friendly 404, otherwise plain text
app.use((req, res) => {
  const notFound = join(SERVE_DIR, '404.html');
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
