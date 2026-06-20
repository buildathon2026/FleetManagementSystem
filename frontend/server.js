import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

// Middleware
app.use(express.json());

console.log(`[Server] Starting on port ${PORT}`);
console.log(`[Server] API URL: ${API_URL}`);

// Debug route
app.get('/debug', (req, res) => {
  res.json({
    PORT,
    API_URL,
    NODE_ENV: process.env.NODE_ENV,
    VITE_API_URL: process.env.VITE_API_URL,
  });
});

// API proxy routes (must be before static files!)
const apiRoutes = ['/ask', '/health', '/feedback', '/conversation'];

apiRoutes.forEach(route => {
  app.all(route, async (req, res) => {
    console.log(`[Proxy Match] ${req.method} ${route}`);
    try {
      const url = `${API_URL}${route}`;
      console.log(`[Proxy] Forwarding to ${url}`);

      const fetchOptions = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(req.body);
      }

      console.log(`[Proxy] Fetch options:`, { method: req.method, url });

      const response = await fetch(url, fetchOptions);
      console.log(`[Proxy] Response status: ${response.status}`);

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error(`[Proxy Error] ${route}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Serve static files
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - must be last!
app.get('*', (req, res) => {
  console.log(`[SPA] Serving index.html for ${req.path}`);
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Ready to serve on http://0.0.0.0:${PORT}`);
});
