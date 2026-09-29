import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './authRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import storageRoutes from './storageRoutes.js';
import sensorRoutes from './sensorRoutes.js';

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
app.use('/api', deviceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Intelligent Vegetable Storage Backend', timestamp: new Date() });
});

// ESP32 Microcontroller proxy endpoints
app.get('/api/esp32/status', async (req, res) => {
  const ip = req.query.ip;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'IP address is required' });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const espRes = await fetch(`http://${ip}/status`, { signal: controller.signal });
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

app.get('/api/esp32/data', async (req, res) => {
  const ip = req.query.ip;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'IP address is required' });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const espRes = await fetch(`http://${ip}/api/data`, { signal: controller.signal });
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
