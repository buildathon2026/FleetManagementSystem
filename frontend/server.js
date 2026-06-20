import express from 'express';
import { createProxyMiddleware } from 'express-http-proxy';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Proxy API requests to backend
app.use('/ask', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/ask': '/ask' },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
}));

app.use('/health', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/health': '/health' },
}));

app.use('/feedback', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/feedback': '/feedback' },
}));

app.use('/conversation', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/conversation': '/conversation' },
}));

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`API proxied to: ${API_URL}`);
});
