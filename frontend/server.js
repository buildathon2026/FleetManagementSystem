import express from 'express';
import httpProxy from 'http-proxy';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

// Create proxy
const proxy = httpProxy.createProxyServer({
  target: API_URL,
  changeOrigin: true,
});

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// API routes
const apiRoutes = ['/ask', '/health', '/feedback', '/conversation'];

apiRoutes.forEach(route => {
  app.all(route, (req, res) => {
    proxy.web(req, res);
  });
});

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`API proxied to: ${API_URL}`);
});
