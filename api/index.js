import express from 'express';
import cors from 'cors';
import authRoutes from '../server/authRoutes.js';
import deviceRoutes from '../server/deviceRoutes.js';
import storageRoutes from '../server/storageRoutes.js';
import sensorRoutes from '../server/sensorRoutes.js';
import spoilageRoutes from '../server/spoilageRoutes.js';
import alertRoutes from '../server/alertRoutes.js';
import analyticsRoutes from '../server/analyticsRoutes.js';
import reportRoutes from '../server/reportRoutes.js';
import settingsRoutes from '../server/settingsRoutes.js';
import adminRoutes from '../server/adminRoutes.js';
import { requireApiKey } from '../server/apiKeyMiddleware.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Support both /api/* and root paths depending on Vercel rewrite configuration
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/storage', storageRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/sensors', sensorRoutes);
app.use('/api/spoilage', spoilageRoutes);
app.use('/spoilage', spoilageRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/admin-api', adminRoutes);
app.use('/api', deviceRoutes);
app.use('/', deviceRoutes);

// Root API endpoint (Requirement 3)
app.get(['/api', '/'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'VegSense API',
    health: '/api/health'
  });
});

// Health check endpoint (public, unauthenticated)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Intelligent Vegetable Storage Backend',
    platform: 'Vercel Serverless',
    timestamp: new Date()
  });
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
// Catch-all for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `API route ${req.method} ${req.originalUrl || req.url} not found.`
  });
});

export default app;

