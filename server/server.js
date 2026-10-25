import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './authRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import storageRoutes from './storageRoutes.js';
import sensorRoutes from './sensorRoutes.js';
import spoilageRoutes from './spoilageRoutes.js';
import alertRoutes from './alertRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import reportRoutes from './reportRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import adminRoutes from './adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend during development
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/spoilage', spoilageRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', deviceRoutes);

import { requireApiKey } from './apiKeyMiddleware.js';

// Root API endpoint (Requirement 3)
app.get(['/api', '/'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'VegSense API',
    health: '/api/health'
  });
});

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'Intelligent Vegetable Storage Backend', timestamp: new Date() });
});

// Dedicated secure endpoint for API-key verification (requires valid VEGSENSE_API_KEY)
app.get(['/api/secure/verify-key', '/secure/verify-key'], requireApiKey, (req, res) => {
  res.json({
    success: true,
    message: 'API key verified successfully.',
    timestamp: new Date().toISOString()
  });
});

/**
 * Validate IP address to protect backend from SSRF attacks against internal/metadata services
 */
function isSafeDeviceIp(ip) {
  if (typeof ip !== 'string') return false;
  const trimmed = ip.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) return false;

  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255 || String(num) !== part) return false;
  }

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // Block loopback (127.0.0.0/8), cloud metadata (169.254.0.0/16), zero (0.0.0.0/8), and multicast (224.0.0.0+)
  if (first === 127 || (first === 169 && second === 254) || first === 0 || first >= 224) {
    return false;
  }

  return true;
}

// ESP32 Microcontroller proxy endpoints
app.get(['/api/esp32/status', '/esp32/status'], async (req, res) => {
  const ip = req.query.ip;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'IP address is required' });
  }

  if (!isSafeDeviceIp(ip)) {
    return res.status(400).json({ success: false, error: 'Invalid or disallowed IP address format' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const espRes = await fetch(`http://${ip.trim()}/status`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!espRes.ok) {
      return res.status(502).json({ success: false, error: 'ESP32 returned error' });
    }
    const data = await espRes.json();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(504).json({ success: false, error: 'ESP32 unreachable or timed out' });
  }
});

app.get(['/api/esp32/data', '/esp32/data'], async (req, res) => {
  const ip = req.query.ip;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'IP address is required' });
  }

  if (!isSafeDeviceIp(ip)) {
    return res.status(400).json({ success: false, error: 'Invalid or disallowed IP address format' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const espRes = await fetch(`http://${ip.trim()}/api/data`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!espRes.ok) {
      return res.status(502).json({ success: false, error: 'ESP32 sensor data error' });
    }
    const data = await espRes.json();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(504).json({ success: false, error: 'ESP32 sensor endpoint unreachable' });
  }
});

// Serve frontend static build in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback for frontend
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server running. Vite frontend is on development port.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
