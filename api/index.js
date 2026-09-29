import express from 'express';
import cors from 'cors';
import authRoutes from '../server/authRoutes.js';
import deviceRoutes from '../server/deviceRoutes.js';
import storageRoutes from '../server/storageRoutes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Support both /api/auth and /auth paths depending on Vercel rewrite configuration
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/storage', storageRoutes);
app.use('/api', deviceRoutes);
app.use('/', deviceRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Intelligent Vegetable Storage Backend',
    platform: 'Vercel Serverless',
    timestamp: new Date()
  });
});

app.get(['/api/esp32/status', '/esp32/status'], async (req, res) => {
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

app.get(['/api/esp32/data', '/esp32/data'], async (req, res) => {
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

export default app;
