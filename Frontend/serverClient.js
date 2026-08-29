/**
 * serverClient.js — Express static server for SignalWorkflow frontend.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3030;
const HOST = process.env.HOST || '0.0.0.0';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:8000';

app.use(
  helmet({
    // Google Sign-In uses postMessage from accounts.google.com/gsi/transform —
    // COOP "same-origin" (Helmet default) breaks that handshake.
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://accounts.google.com',
          'https://apis.google.com',
        ],
        'script-src-elem': [
          "'self'",
          "'unsafe-inline'",
          'https://accounts.google.com',
          'https://apis.google.com',
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://accounts.google.com',
        ],
        'style-src-elem': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://accounts.google.com',
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        'connect-src': [
          "'self'",
          BACKEND_URL,
          'http://localhost:8000',
          'https://localhost:8000',
          'https://accounts.google.com',
          'https://oauth2.googleapis.com',
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
        ],
        'frame-src': [
          "'self'",
          'https://accounts.google.com',
        ],
        'worker-src': ["'self'", 'blob:'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'frame-ancestors': ["'self'"],
      },
    },
  }),
);

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log('--------------------------------------------------');
  console.log('SignalWorkflow Frontend Server Running');
  console.log(`URL: http://${HOST}:${PORT}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log('--------------------------------------------------');
});
